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

# Load sensitive keys from .env
load_dotenv()

# SETTINGS & EMBEDDING MODEL
PINECONE_INDEX_NAME = "email-knowledge-graph"
EMBED_MODEL_NAME = "llama-text-embed-v2"
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "password")

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
    return AsyncGraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))

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

def retrieve_vector_context(query, top_k=5):
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
        print(f"[RETR] NLTK Fallback Used: {e}")
        return [word.strip() for word in query.split() if len(word) > 3]

async def retrieve_graph_context_async(query, driver=None):
    # Use global driver if provided, else create temporary (fallback)
    active_driver = driver or get_async_neo4j_driver()
    knowledge_triples = []
    nodes_map = {}
    rels_list = []
    
    keywords = filter_keywords(query)

    def add_node_to_graph(node):
        if not node: return
        n_id = str(node.element_id)
        if n_id not in nodes_map:
            nodes_map[n_id] = {
                "id": n_id,
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
        async with active_driver.session() as session:
            query_tasks = []
            for kw in keywords:
                # Semantic Entity Triples
                query_tasks.append(session.run("""
                    MATCH (n:Entity)
                    WHERE toLower(n.name) CONTAINS toLower($kw)
                    MATCH (n)-[r]->(related:Entity)
                    RETURN n, r, related
                    LIMIT 3
                """, kw=kw))

                # Communication Network
                query_tasks.append(session.run("""
                    MATCH (e:Employee)
                    WHERE toLower(e.name) CONTAINS toLower($kw) OR toLower(e.email) CONTAINS toLower($kw)
                    MATCH (e)-[r:COMMUNICATES_WITH]->(other:Employee)
                    RETURN e, r, other
                    ORDER BY r.frequency DESC LIMIT 3
                """, kw=kw))
            
            if query_tasks:
                results = await asyncio.gather(*query_tasks)
                for res in results:
                    async for record in res:
                        # Extract based on flexible return types
                        r = record.get('r')
                        n = record.get('n') or record.get('e')
                        related = record.get('related') or record.get('other')
                        
                        if n and r and related:
                            # Update text context
                            if 'name' in n and 'name' in related:
                                knowledge_triples.append(f"Fact: {n['name']} -[{r.type}]-> {related['name']}")
                            # Update graph visualization
                            add_rel_to_graph(r)
    except Exception as e:
        print(f"[RETR] Graph Retrieval Error: {e}")
    finally:
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
    
    # 1. Vector Search (Offloaded to thread as it holds GIL/I/O)
    vector_task = asyncio.to_thread(retrieve_vector_context, query)
    
    # 2. Graph Retrieval (Async native)
    graph_task = retrieve_graph_context_async(query, driver=driver)

    print("[SYSTEM] Firing simultaneous Vector & Graph probes...")
    
    try:
        vector_res, (graph_facts, graph_data) = await asyncio.gather(vector_task, graph_task)
        vector_context = "\n".join([f"- {doc.page_content}" for doc in vector_res])
        graph_context = "\n".join(graph_facts)
    except Exception as e:
        print(f"[ERROR] Hybrid Retrieval Exception: {e}")
        vector_context = "Vector lookup error."
        graph_context = "Graph lookup error."
        graph_data = {"nodes": [], "relationships": []}

    context_str = (
        f"--- STRUCTURED KNOWLEDGE (Neo4j) ---\n{graph_context}\n\n"
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
            model="gemini-3-flash-preview", 
            google_api_key=os.getenv("GEMINI_AI_API_KEY"),
            temperature=0,
            timeout=30 # Prevent long hangs
        )
        # Check if user specifically wanted gemini-3 and update if safe
        # model="gemini-3-flash-preview"
        
        system_prompt = """
        You are an AI Enterprise Intelligence Assistant. 
        Use the provided contexts to answer the user's question accurately.
        - 'STRUCTURED KNOWLEDGE' contains direct facts from the Knowledge Graph.
        - 'SEMANTIC SNIPPETS' contains broader context from emails.
        
        Synthesize information from BOTH sources. 
        If the context doesn't contain enough information, state that clearly and do not hallucinate external information.
        Your knowledge boundary is strictly limited to the provided internal data.
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
