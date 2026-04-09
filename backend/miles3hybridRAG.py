"""Hybrid RAG Pipeline for Enterprise Intelligence.

This module implements a Retrieval-Augmented Generation (RAG) system that combines:
1. Semantic Search: Vector-based retrieval using Pinecone and Llama-embeddings.
2. Structured Retrieval: Graph-based context from Neo4j Knowledge Graph (AuraDB).
3. Generative Synthesis: Gemini-powered answer generation based on the hybrid context.
"""

import os
import re
import sys
import time
import asyncio
import pandas as pd
from pathlib import Path
from dotenv import load_dotenv

# Neo4j and Pinecone core
from neo4j import GraphDatabase, AsyncGraphDatabase
from pinecone import Pinecone, ServerlessSpec

# LangChain core
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# LangChain Integrations
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_pinecone import PineconeVectorStore, PineconeEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI

# Local Configuration
from config import (
    GEMINI_API_KEY, PINECONE_API_KEY, 
    NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD
)

# [SECTION: CONFIGURATION & GLOBAL SETTINGS]
PINECONE_INDEX_NAME = "email-knowledge-graph"
EMBED_MODEL_NAME = "llama-text-embed-v2"

# Optimized Cached Provider Instances
_embeddings_instance = None
_vectorstore_instance = None

# Load Environment from .env if needed
load_dotenv()

# [SECTION: DRIVERS & PROVIDERS]
def get_embeddings():
    """Initializes and caches the Pinecone Embedding provider."""
    global _embeddings_instance
    if _embeddings_instance is None:
        print("[INIT] Loading Embedding Model...")
        _embeddings_instance = PineconeEmbeddings(model=EMBED_MODEL_NAME)
    return _embeddings_instance

def get_vectorstore():
    """Initializes and caches the Pinecone VectorStore connection."""
    global _vectorstore_instance
    if _vectorstore_instance is None:
        embeddings = get_embeddings()
        print("[INIT] Connecting to Pinecone...")
        _vectorstore_instance = PineconeVectorStore(index_name=PINECONE_INDEX_NAME, embedding=embeddings)
    return _vectorstore_instance

def get_text_splitter():
    """Provides a standardized text splitter for ingestion."""
    return RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50,
        length_function=len,
    )

def get_async_neo4j_driver():
    """Provides an asynchronous Neo4j driver optimized for RAG retrieval."""
    return AsyncGraphDatabase.driver(
        NEO4J_URI, 
        auth=(NEO4J_USER, NEO4J_PASSWORD),
        max_connection_lifetime=600,
        keep_alive=True
    )

def get_neo4j_driver():
    """Provides a synchronous Neo4j driver for direct management tasks."""
    try:
        driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
        driver.verify_connectivity()
        return driver
    except Exception:
        if NEO4J_URI.startswith("neo4j://"):
            fallback = NEO4J_URI.replace("neo4j://", "bolt://")
            return GraphDatabase.driver(fallback, auth=(NEO4J_USER, NEO4J_PASSWORD))
        raise

# [SECTION: UTILITIES]
def filter_query(query):
    """
    Cleans original query for direct Neo4j Full-Text searching.
    Ensures alphanumeric characters and standard phrasing are preserved.
    """
    # Remove standard punctuation but keep spaces and alphanumeric
    clean = re.sub(r'[^a-zA-Z0-9\s]', ' ', query)
    # Collapse multiple spaces and trim
    clean = re.sub(r'\s+', ' ', clean).strip()
    return clean

def sanitize_data(data):
    """Recursively converts non-serializable objects (Neo4j values) to JSON-safe formats."""
    if isinstance(data, dict):
        return {k: sanitize_data(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [sanitize_data(i) for i in data]
    elif isinstance(data, (int, float, bool, str)) or data is None:
        return data
    else:
        return str(data)

def format_pinecone_id(text):
    """Creates a URL-safe ID for Pinecone vector storage."""
    clean_id = text.encode("ascii", "ignore").decode()
    clean_id = re.sub(r'[^a-zA-Z0-9\-_]', '_', clean_id)
    return clean_id

# [SECTION: CORE RETRIEVAL - VECTOR]
def retrieve_vector_context(query, top_k=10):
    """Performs a synchronous semantic search on Pinecone."""
    try:
        vstore = get_vectorstore()
        return vstore.similarity_search(query, k=top_k)
    except Exception as e:
        print(f"[RETRIEVE] Vector Store Retrieval Error: {e}")
        return []

# [SECTION: CORE RETRIEVAL - GRAPH]
async def retrieve_graph_context(query, driver=None):
    """
    Performs a high-performance Full-Text search on Neo4j AuraDB.
    Returns structured facts (triples) and graph data for visualization.
    """
    active_driver = driver or get_async_neo4j_driver()
    knowledge_triples, nodes_map, rels_list = [], {}, []
    
    # Process original query for native indexing
    graph_query = filter_query(query)
    if not graph_query:
        return [], {"nodes": [], "relationships": []}

    def add_node_to_graph(node):
        if not node: return
        n_id = str(node.element_id)
        if n_id not in nodes_map:
            name = node.get('name') or node.get('subject') or node.get('email') or f"{list(node.labels)[0]}"
            nodes_map[n_id] = {
                "id": n_id,
                "display_name": name,
                "labels": list(node.labels),
                "properties": sanitize_data(dict(node))
            }

    def add_rel_to_graph(rel):
        if not rel: return
        r_id = str(rel.element_id)
        if any(r["id"] == r_id for r in rels_list): return
        rels_list.append({
            "id": r_id, "type": rel.type,
            "from": str(rel.start_node.element_id), 
            "to": str(rel.end_node.element_id),
            "properties": sanitize_data(dict(rel))
        })
        add_node_to_graph(rel.start_node)
        add_node_to_graph(rel.end_node)

    try:
        async with active_driver.session() as session:
            # Leverage AuraDB's Native English Analyzer for smart keyword search
            res = await session.run("""
                CALL db.index.fulltext.queryNodes("global_search_index", $graph_query) 
                YIELD node AS n, score
                MATCH (n)-[r]-(related)
                RETURN n, r, related, score
                ORDER BY score DESC
                LIMIT 200
            """, graph_query=graph_query)
            
            async for record in res:
                n, r, related = record["n"], record["r"], record["related"]
                if n and r and related:
                    # Formulate structured fact for LLM synthesis
                    n_json, rel_json, r_json = sanitize_data(dict(n)), sanitize_data(dict(related)), sanitize_data(dict(r))
                    knowledge_triples.append(f"Fact: {n_json} -[{r.type}]-> {rel_json} [Props: {r_json}]")
                    add_rel_to_graph(r)
                    
    except Exception as e:
        print(f"[RETR] Graph Intelligence Retrieval Error: {e}")
    finally:
        if not driver: await active_driver.close()

    return list(set(knowledge_triples)), {"nodes": list(nodes_map.values()), "relationships": rels_list}

# [SECTION: HYBRID FUSION]
async def retrieve_hybrid_context(query, driver=None):
    """Fuses results from Vector and Graph databases in parallel."""
    print(f"\n[CORE] Fusing chunk data(pinecone) & neo4j data for Query: '{query}'")
    start_time = time.perf_counter()
    
    # Independent Vector search task
    async def safe_vector_search():
        try:
            return await asyncio.to_thread(retrieve_vector_context, query)
        except Exception as e:
            print(f"[CORE] Vector side failure: {e}")
            return []

    # Independent Graph search task
    async def safe_graph_search():
        try:
            return await retrieve_graph_context(query, driver=driver)
        except Exception as e:
            print(f"[CORE] Graph side failure: {e}")
            return [], {"nodes": [], "relationships": []}

    # Parallel Execution
    vector_res, (graph_facts, graph_data) = await asyncio.gather(
        safe_vector_search(),
        safe_graph_search()
    )

    # Context Structuring
    vector_context = "\n".join([f"- {doc.page_content}" for doc in vector_res]) if vector_res else "No semantic snippets found."
    graph_context = "\n".join(graph_facts) if graph_facts else "No structured facts found."

    context_str = (
        f"--- STRUCTURED KNOWLEDGE ---\n{graph_context}\n\n"
        f"--- SEMANTIC SNIPPETS ---\n{vector_context}"
    )
    
    print(f"[CORE] Fusion complete in {time.perf_counter() - start_time:.4f}s")
    return context_str, graph_data

# [SECTION: AI SYNTHESIS]
async def generate_answer_async(query, driver=None):
    """Generating a detailed report using Gemini and the hybrid context."""
    context_str, graph_data = await retrieve_hybrid_context(query, driver=driver)
    
    print("[AI] Generating Report (Gemini)...")
    gen_start = time.perf_counter()
    
    try:
        llm = ChatGoogleGenerativeAI(
            model="gemini-3-flash-preview",
            google_api_key=GEMINI_API_KEY, 
            temperature=0,
            timeout=120
        )
        
        system_prompt = """
        You are the Senior Forensic Intelligence Lead for an Enterprise Intelligence Suite. 
        Your mission is to provide an exhaustive, deep-dive analysis for any query related to the internal dataset. 

        ### CORE OBJECTIVE:
        Extract and synthesize EVERY RELEVANT DETAIL from the provided contexts. Do not summarize so much that important nuances are lost. If the data contains specific dates, names, amounts, or technical IDs, include them.

        ### DATA SOURCES:
        1. **STRUCTURED KNOWLEDGE (GraphDatabase)**: Contains verified entities, relationships, and property-based facts. This is the "Skeleton" of the truth.
        2. **SEMANTIC SNIPPETS (VectorStore)**: Contains natural language context from emails and documents. This is the "Muscle and Skin" (narrative, intent, tone).

        ### ANALYSIS GUIDELINES:
        - **Zero-Loss Synthesis**: If multiple sources mention the same event, combine their details for a richer picture.
        - **Relational Mapping**: Use the Knowledge Graph facts to explain how different people, companies, or projects are connected.
        - **Strict Evidence Grounding**: Your answer must be DERIVED ONLY from the provided contexts. If the query asks for something not in the data, state: "The current intelligence repository does not contain records for [X]."
        - **Analytical Depth**: Look for hidden connections. If Person A emailed Person B about Project X, and the Graph shows Project X is owned by Company C, connect those dots.

        ### MANDATORY REPORT STRUCTURE:
        1. **Executive Intelligence Summary**: A high-level overview of the findings.
        2. **Comprehensive Detailed Findings**: An exhaustive list of facts, bulleted for clarity.
        3. **Relational & Network Context**: A breakdown of how entities involved relate to each other (leverage Graph triples here).
        4. **Data Sources**: Briefly list which sources (Emails vs. Graph) contributed to this report.

        ### VISUAL DESIGN & FORMATTING:
        - Use **Bold** for key entities, organizations, and critical dates.
        - Use `inline code` for technical identifiers (message IDs, extensions, etc.).
        - Use tables if comparing multiple entities or structured properties.
        """
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", "Context Data:\n{context}\n\nQuery: {query}")
        ])
        
        chain = prompt | llm | StrOutputParser()
        answer = await chain.ainvoke({"context": context_str, "query": query})
        
        print(f"[AI] Synthesis complete in {time.perf_counter() - gen_start:.4f}s")
        return {"answer": answer, "graph": graph_data}
    except Exception as e:
        print(f"[AI] Critical Synthesis Error: {e}")
        return {"answer": f"Intelligence synthesis failed: {str(e)}", "graph": graph_data}

def generate_answer(query):
    """Synchronous interface for answer generation."""
    return asyncio.run(generate_answer_async(query))

# [SECTION: LEGACY INGESTION]
def build_vector_index(email_csv):
    """Utility to rebuild the vector database index from existing data."""
    pc = Pinecone(api_key=PINECONE_API_KEY)
    
    if PINECONE_INDEX_NAME not in pc.list_indexes().names():
        pc.create_index(
            name=PINECONE_INDEX_NAME, dimension=1024, metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1")
        )
        while not pc.describe_index(PINECONE_INDEX_NAME).status['ready']: time.sleep(1)

    embeddings, splitter = get_embeddings(), get_text_splitter()
    docs, doc_ids = [], []

    if os.path.exists(email_csv):
        df = pd.read_csv(email_csv)
        for _, row in df.iterrows():
            full_text = str(row.get('body_cleaned', row.get('body', '')))
            if not full_text or full_text.lower() == 'nan': continue
            
            msg_id = str(row['message_id'])
            metadata = {"source": "email", "message_id": msg_id, "subject": str(row.get('subject', 'No Subject'))}
            chunks = splitter.split_text(full_text)
            for i, chunk in enumerate(chunks):
                docs.append(Document(page_content=chunk, metadata=metadata))
                doc_ids.append(f"email_{format_pinecone_id(msg_id)}_{i}")

    if not docs: return

    index = pc.Index(PINECONE_INDEX_NAME)
    batch_size = 100
    total_processed = 0
    total_new = 0

    print(f"[BUILD] Synchronizing {len(docs)} chunks in batches of {batch_size}...")

    for i in range(0, len(docs), batch_size):
        batch_docs = docs[i : i + batch_size]
        batch_ids = doc_ids[i : i + batch_size]
        total_processed += len(batch_docs)

        # Check existing IDs to prevent re-uploading
        existing_ids = set()
        try:
            fetch_response = index.fetch(ids=batch_ids)
            existing_ids.update(fetch_response.vectors.keys())
        except Exception as e:
            print(f"[BUILD] Warning: Error checking existing vectors: {e}")

        new_docs = [doc for doc, d_id in zip(batch_docs, batch_ids) if d_id not in existing_ids]
        new_ids  = [d_id for d_id in batch_ids if d_id not in existing_ids]

        if new_docs:
            vectorstore = PineconeVectorStore(index_name=PINECONE_INDEX_NAME, embedding=embeddings)
            vectorstore.add_documents(new_docs, ids=new_ids)
            total_new += len(new_docs)
            print(f"[BUILD] Progress: {total_processed}/{len(docs)} chunks examined. Uploaded {len(new_docs)} new chunks.")
        else:
            print(f"[BUILD] Progress: {total_processed}/{len(docs)} chunks examined. Batch already exists in Pinecone.")

    if total_new > 0:
        print(f"[BUILD] Synchronization Finished. {total_new} new chunks uploaded.")
    else:
        print("[BUILD] Synchronization Finished. All data already existed in Pinecone.")

# [SECTION: CLI ENTRY POINT]
if __name__ == "__main__":
    # Standard CSV path for ingestion
    BASE_DIR = Path(__file__).resolve().parent.parent
    DEFAULT_EMAIL_CSV = str(BASE_DIR / "data" / "processed" / "emails" / "sample_email.csv")

    # Synchronize the Vector Database (Pinecone)
    if "--build" in sys.argv:
        build_idx = sys.argv.index("--build")
        csv_path = DEFAULT_EMAIL_CSV
        if build_idx + 1 < len(sys.argv) and not sys.argv[build_idx + 1].startswith("--"):
            csv_path = sys.argv[build_idx + 1]
            
        print(f"[BUILD] Starting Vector Index Ingestion for: {csv_path}")
        build_vector_index(csv_path)
        print("[BUILD] Data Upload Complete.")

    # HybridRAG Search
    if "--query" in sys.argv:
        query_idx = sys.argv.index("--query")
        question = " ".join(sys.argv[query_idx + 1:])
        if question:
            res = generate_answer(question)
            print(f"\nFinal Answer:\n{res['answer']}")
        else:
            print("[ERROR] Please provide a question after --query")
