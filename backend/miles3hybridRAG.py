"""Hybrid RAG Pipeline for Enterprise Intelligence.

This module implements a Retrieval-Augmented Generation (RAG) system that combines:
1. Semantic Search: Vector-based retrieval using Pinecone and Llama-embeddings.
2. Structured Retrieval: Graph-based context from Neo4j Knowledge Graph.
3. Generative Synthesis: Gemini-powered answer generation based on the hybrid context.
"""

import os
import re
import sys
import time
import asyncio
import pandas as pd
from pathlib import Path

# --- NLTK Setup (Optimized to prevent hangs) ---
import nltk
def ensure_nltk_data():
    try:
        nltk.data.find('tokenizers/punkt')
    except LookupError:
        print("[NLTK] Downloading punkt...")
        nltk.download('punkt', quiet=True)
    try:
        nltk.data.find('corpora/stopwords')
    except LookupError:
        print("[NLTK] Downloading stopwords...")
        nltk.download('stopwords', quiet=True)

# Run once during module load
try:
    ensure_nltk_data()
except Exception as e:
    print(f"[NLTK] Warning: Could not verify or download NLTK data: {e}")

from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from dotenv import load_dotenv

# Neo4j and Pinecone core
from neo4j import GraphDatabase, AsyncGraphDatabase
from neo4j.graph import Node, Relationship
from pinecone import Pinecone, ServerlessSpec

# LangChain components
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_pinecone import PineconeVectorStore, PineconeEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI

# Centralized Configuration
from config import (
    GEMINI_API_KEY, PINECONE_API_KEY, 
    NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD
)

# SETTINGS & EMBEDDING MODEL
PINECONE_INDEX_NAME = "email-knowledge-graph"
EMBED_MODEL_NAME = "llama-text-embed-v2"

# --- OPTIMIZED CACHED ACCESS ---
_embeddings_instance = None
_vectorstore_instance = None

def get_embeddings():
    global _embeddings_instance
    if _embeddings_instance is None:
        print("[INIT] Loading Embedding Model...")
        _embeddings_instance = PineconeEmbeddings(model=EMBED_MODEL_NAME)
    return _embeddings_instance

def get_vectorstore():
    global _vectorstore_instance
    if _vectorstore_instance is None:
        embeddings = get_embeddings()
        print("[INIT] Connecting to Pinecone Index...")
        _vectorstore_instance = PineconeVectorStore(index_name=PINECONE_INDEX_NAME, embedding=embeddings)
    return _vectorstore_instance

def get_text_splitter():
    return RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50,
        length_function=len,
    )

def get_neo4j_driver():
    try:
        driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
        driver.verify_connectivity()
        return driver
    except Exception:
        if NEO4J_URI.startswith("neo4j://"):
            fallback = NEO4J_URI.replace("neo4j://", "bolt://")
            return GraphDatabase.driver(fallback, auth=(NEO4J_USER, NEO4J_PASSWORD))
        raise

def get_async_neo4j_driver():
    return AsyncGraphDatabase.driver(
        NEO4J_URI, 
        auth=(NEO4J_USER, NEO4J_PASSWORD),
        max_connection_lifetime=600
    )

def format_pinecone_id(text):
    clean_id = text.encode("ascii", "ignore").decode()
    clean_id = re.sub(r'[^a-zA-Z0-9\-_]', '_', clean_id)
    return clean_id

# --- INGESTION ---

def build_vector_index(email_csv):
    pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
    
    if PINECONE_INDEX_NAME not in pc.list_indexes().names():
        pc.create_index(
            name=PINECONE_INDEX_NAME,
            dimension=1024, 
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1")
        )
        while not pc.describe_index(PINECONE_INDEX_NAME).status['ready']:
            time.sleep(1)

    embeddings = get_embeddings()
    splitter = get_text_splitter()
    docs = []
    doc_ids = []

    if os.path.exists(email_csv):
        df = pd.read_csv(email_csv)
        for _, row in df.iterrows():
            full_text = str(row.get('body_cleaned', row.get('body', '')))
            if not full_text or full_text.lower() == 'nan': 
                continue
            
            msg_id = str(row['message_id'])
            metadata = {
                "source": "email",
                "message_id": msg_id, 
                "subject": str(row.get('subject', 'No Subject'))
            }
            chunks = splitter.split_text(full_text)
            for i, chunk in enumerate(chunks):
                docs.append(Document(page_content=chunk, metadata=metadata))
                safe_msg_id = format_pinecone_id(msg_id)
                doc_ids.append(f"email_{safe_msg_id}_{i}")

    if not docs:
        return

    index = pc.Index(PINECONE_INDEX_NAME)
    batch_size = 100
    for i in range(0, len(docs), batch_size):
        batch_docs = docs[i : i + batch_size]
        batch_ids = doc_ids[i : i + batch_size]

        existing_ids = set()
        try:
            fetch_response = index.fetch(ids=batch_ids)
            existing_ids.update(fetch_response.vectors.keys())
        except:
            pass

        new_docs = [doc for doc, d_id in zip(batch_docs, batch_ids) if d_id not in existing_ids]
        new_ids  = [d_id for d_id in batch_ids if d_id not in existing_ids]

        if new_docs:
            vectorstore = PineconeVectorStore(index_name=PINECONE_INDEX_NAME, embedding=embeddings)
            vectorstore.add_documents(new_docs, ids=new_ids)

# --- RETRIEVAL ---

def retrieve_vector_context(query, top_k=10):
    """Synchronous vector search wrapper."""
    try:
        vstore = get_vectorstore()
        return vstore.similarity_search(query, k=top_k)
    except Exception as e:
        print(f"[RETR] Vector Retrieval Error: {e}")
        return []

def sanitize_data(data):
    """Recursively converts non-serializable types (Neo4j objects, etc.) to JSON-safe formats."""
    if isinstance(data, dict):
        return {k: sanitize_data(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [sanitize_data(i) for i in data]
    elif isinstance(data, (int, float, bool, str)) or data is None:
        return data
    else:
        return str(data)

def filter_keywords(query):
    """Processes query into high-signal keywords using NLTK or fallback."""
    try:
        stop_words = set(stopwords.words('english'))
        word_tokens = word_tokenize(query)
        return [w for w in word_tokens if not w.lower() in stop_words and len(w) > 2]
    except Exception as e:
        # Reduced print to avoid clutter, using simple split
        return [word.strip(",.!?") for word in query.split() if len(word) > 3]

async def retrieve_graph_context_async(query, driver=None):
    # Determine the driver to use
    active_driver = driver or get_async_neo4j_driver()
    knowledge_triples = []
    nodes_map = {}
    rels_list = []
    
    keywords = filter_keywords(query)
    if not keywords:
        return [], {"nodes": [], "relationships": []}

    def add_node_to_graph(node):
        if not node: return
        n_id = str(node.element_id)
        if n_id not in nodes_map:
            # Determine a friendly display name for the node
            display_name = node.get('name') or node.get('subject') or node.get('email') or f"{list(node.labels)[0]}"
            nodes_map[n_id] = {
                "id": n_id,
                "display_name": display_name,
                "labels": list(node.labels),
                "properties": sanitize_data(dict(node))
            }

    def add_rel_to_graph(rel):
        if not rel: return
        r_id = str(rel.element_id)
        if any(r["id"] == r_id for r in rels_list): return
        
        s_id = str(rel.start_node.element_id)
        t_id = str(rel.end_node.element_id)
        
        rels_list.append({
            "id": r_id, "type": rel.type,
            "from": s_id, "to": t_id,
            "properties": sanitize_data(dict(rel))
        })
        add_node_to_graph(rel.start_node)
        add_node_to_graph(rel.end_node)

    try:
        # HIGH-PERFORMANCE SEARCH: Using Neo4j Full-Text Index
        async with active_driver.session() as session:
            # Combine keywords into a Lucene query string (e.g., "keyword1 OR keyword2")
            lucene_query = " OR ".join(keywords)
            
            res = await session.run("""
                CALL db.index.fulltext.queryNodes("global_search_index", $lucene_query) 
                YIELD node AS n, score
                MATCH (n)-[r]-(related)
                RETURN n, r, related, score
                ORDER BY score DESC
                LIMIT 200
            """, lucene_query=lucene_query)
            
            async for record in res:
                r = record["r"]
                n = record["n"]
                related = record["related"]
                
                if n and r and related:
                    # Robust Fact Generation for LLM
                    # High-fidelity extraction: Provide the full property set to the LLM
                    n_json = sanitize_data(dict(n))
                    rel_json = sanitize_data(dict(related))
                    r_json = sanitize_data(dict(r))
                    knowledge_triples.append(f"Fact: {n_json} -[{r.type}]-> {rel_json} [Props: {r_json}]")
                    
                    # Update graph visualization
                    add_rel_to_graph(r)
                    
    except Exception as e:
        print(f"[RETR] Broad Graph Retrieval Error: {e}")
    finally:
        # Only close if we created a temporary driver
        if not driver:
            await active_driver.close()

    graph_data = {
        "nodes": list(nodes_map.values()),
        "relationships": rels_list
    }
    return list(set(knowledge_triples)), graph_data

async def retrieve_hybrid_context_async(query, driver=None):
    # Parallelize context retrieval for maximum performance
    print(f"\n[PHASE 1] Pulling Intelligence for: {query}")
    start_all = time.perf_counter()
    
    # 1. Vector Search
    async def safe_vector_search():
        v_start = time.perf_counter()
        try:
            res = await asyncio.to_thread(retrieve_vector_context, query)
            latency = time.perf_counter() - v_start
            print(f"[RETR] Vector probe complete: {latency:.4f}s")
            return res
        except Exception as e:
            print(f"[RETR] Vector failure: {e}")
            return []

    # 2. Graph Retrieval
    async def safe_graph_search():
        g_start = time.perf_counter()
        try:
            res = await retrieve_graph_context_async(query, driver=driver)
            latency = time.perf_counter() - g_start
            print(f"[RETR] Graph probe complete: {latency:.4f}s")
            return res
        except Exception as e:
            print(f"[RETR] Graph failure: {e}")
            return [], {"nodes": [], "relationships": []}

    print("[SYSTEM] Firing independent Vector & Graph probes...")
    vector_res, (graph_facts, graph_data) = await asyncio.gather(
        safe_vector_search(),
        safe_graph_search()
    )

    vector_context = "\n".join([f"- {doc.page_content}" for doc in vector_res]) if vector_res else "No semantic snippets found."
    graph_context = "\n".join(graph_facts) if graph_facts else "No structured facts found."

    context_str = (
        f"--- STRUCTURED KNOWLEDGE ---\n{graph_context}\n\n"
        f"--- SEMANTIC SNIPPETS ---\n{vector_context}"
    )
    
    total_latency = time.perf_counter() - start_all
    print(f"[METRIC] Total Hybrid Retrieval Latency: {total_latency:.4f}s")
    return context_str, graph_data

# --- GENERATION ---

async def generate_answer_async(query, driver=None):
    context_str, graph_data = await retrieve_hybrid_context_async(query, driver=driver)
    
    print("[PHASE 2] Synthesizing Intelligence (Gemini)...")
    gen_start = time.perf_counter()
    
    try:
        llm = ChatGoogleGenerativeAI(
            model="gemini-3-flash-preview", # Stable and performant
            google_api_key=GEMINI_API_KEY, 
            temperature=0,
            timeout=30 # Prevent long hangs
        )
        # Check if user specifically wanted gemini-3 and update if safe
        # model="gemini-3-flash-preview"
        
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
            ("human", "Context:\n{context}\n\nQuestion: {query}")
        ])
        
        parser = StrOutputParser()
        chain = prompt | llm | parser
        answer = await chain.ainvoke({"context": context_str, "query": query})
        
        print(f"Synthesis Duration: {time.perf_counter() - gen_start:.4f}s")
        print("-" * 50)
        return {"answer": answer, "graph": graph_data}
    except Exception as e:
        print(f"[ERROR] LLM Synthesis Error: {e}")
        return {"answer": f"Intelligence synthesis failed: {str(e)}", "graph": graph_data}

def generate_answer(query):
    return asyncio.run(generate_answer_async(query))

if __name__ == "__main__":
    BASE_DIR = Path(__file__).resolve().parent.parent
    EMAIL_PATH = str(BASE_DIR / "data" / "processed" / "emails" / "sample_email.csv")
    
    if "--query" in sys.argv:
        question = " ".join(sys.argv[sys.argv.index("--query") + 1:])
        res = generate_answer(question)
        print(f"Result:\n{res['answer']}")
