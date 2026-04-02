"""Hybrid RAG Pipeline for Enterprise Intelligence.

This module implements a Retrieval-Augmented Generation (RAG) system that combines:
1. Semantic Search: Vector-based retrieval using Pinecone and Llama-embeddings.
2. Structured Retrieval: Graph-based context from Neo4j Knowledge Graph.
3. Generative Synthesis: Gemini-powered answer generation based on the hybrid context.
<<<<<<< HEAD

Key workflow:
- --build: Ingests email data into Pinecone.
- --query: Executes a hybrid search and generates a natural language answer.
=======
>>>>>>> recovery-branch
"""

import os
import re
import sys
import time
<<<<<<< HEAD
import pandas as pd
import numpy as np
from dotenv import load_dotenv

# Neo4j and Pinecone core
from neo4j import GraphDatabase
=======
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
>>>>>>> recovery-branch
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

<<<<<<< HEAD

# SETTINGS & EMBEDDING MODEL
PINECONE_INDEX_NAME = "email-knowledge-graph"
EMBED_MODEL_NAME = "llama-text-embed-v2"

def get_embeddings():
    """Initializes the Pinecone embedding model (1024 dimensions).
    
    Returns:
        PineconeEmbeddings: An initialized embedding model using llama-text-embed-v2.
    """
    return PineconeEmbeddings(model=EMBED_MODEL_NAME)

def get_text_splitter():
    """Configures the text splitter for breaking emails into searchable chunks.
    
    Uses RecursiveCharacterTextSplitter with specific chunk sizes and overlaps
    optimized for email content retrieval.
    
    Returns:
        RecursiveCharacterTextSplitter: A configured splitter instance.
    """
=======
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
>>>>>>> recovery-branch
    return RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50,
        length_function=len,
<<<<<<< HEAD
        is_separator_regex=False,
    )
    

def get_neo4j_driver():
    """Initializes the Neo4j driver using environment variables.
    
    Returns:
        GraphDatabase.driver: A driver instance connected to the Neo4j database.
    """
    uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
    user = os.getenv("NEO4J_USER", "neo4j")
    password = os.getenv("NEO4J_PASSWORD", "password")
    return GraphDatabase.driver(uri, auth=(user, password))


def format_pinecone_id(text):
    """Formats strings to be compliant with Pinecone's ID requirements.
    
    Pinecone IDs must be ASCII only and avoid certain special characters.
    
    Args:
        text (str): The raw ID or text to format.
        
    Returns:
        str: A clean string safe for use as a Pinecone ID.
    """
=======
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
>>>>>>> recovery-branch
    clean_id = text.encode("ascii", "ignore").decode()
    clean_id = re.sub(r'[^a-zA-Z0-9\-_]', '_', clean_id)
    return clean_id

<<<<<<< HEAD

# INGESTION (BUILD THE VECTOR KNOWLEDGE BASE)

def build_vector_index(email_csv):
    """Main ingestion loop for Vector Storage (Pinecone).
    
    Workflow:
    1. Checks for Pinecone index existence (creates if missing).
    2. Chunks email bodies using RecursiveCharacterTextSplitter.
    3. Deduplicates IDs before upload to save Write Units (WUs) via index.fetch().
    4. Uploads in batches of 100 to avoid URI size and memory limits.
    
    Args:
        email_csv (str): Path to the CSV file containing email data.
    """
    pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
    
    # Create index if it doesn't exist
    if PINECONE_INDEX_NAME not in pc.list_indexes().names():
        print(f"Creating Pinecone index: {PINECONE_INDEX_NAME}...")
=======
# --- INGESTION ---

def build_vector_index(email_csv):
    pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
    
    if PINECONE_INDEX_NAME not in pc.list_indexes().names():
>>>>>>> recovery-branch
        pc.create_index(
            name=PINECONE_INDEX_NAME,
            dimension=1024, 
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1")
        )
<<<<<<< HEAD
        # Busy-wait until index is operational
=======
>>>>>>> recovery-branch
        while not pc.describe_index(PINECONE_INDEX_NAME).status['ready']:
            time.sleep(1)

    embeddings = get_embeddings()
    splitter = get_text_splitter()
    docs = []
    doc_ids = []

<<<<<<< HEAD
    # --- Loading Emails ---
    if os.path.exists(email_csv):
        df = pd.read_csv(email_csv)
        print(f"Ingesting {len(df)} emails from {email_csv}...")
        for _, row in df.iterrows():
            # Only index the cleaned body to save cost/space
=======
    if os.path.exists(email_csv):
        df = pd.read_csv(email_csv)
        for _, row in df.iterrows():
>>>>>>> recovery-branch
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
<<<<<<< HEAD
                # Generate a unique deterministic ID for each chunk
=======
>>>>>>> recovery-branch
                safe_msg_id = format_pinecone_id(msg_id)
                doc_ids.append(f"email_{safe_msg_id}_{i}")

    if not docs:
<<<<<<< HEAD
        print("Error: No data found to index.")
        return

    print(f"Indexing {len(docs)} document chunks to Pinecone (Batch size: 100)...")

    batch_size = 100
    index = pc.Index(PINECONE_INDEX_NAME)

=======
        return

    index = pc.Index(PINECONE_INDEX_NAME)
    batch_size = 100
>>>>>>> recovery-branch
    for i in range(0, len(docs), batch_size):
        batch_docs = docs[i : i + batch_size]
        batch_ids = doc_ids[i : i + batch_size]

<<<<<<< HEAD
        # --- IDEMPOTENCY CHECK ---
        # Only upload what doesn't already exist to save Pinecone Write Units
=======
>>>>>>> recovery-branch
        existing_ids = set()
        try:
            fetch_response = index.fetch(ids=batch_ids)
            existing_ids.update(fetch_response.vectors.keys())
<<<<<<< HEAD
        except Exception as e:
            print(f"Warning: Could not check existing IDs ({e}). Proceeding anyway.")
=======
        except:
            pass
>>>>>>> recovery-branch

        new_docs = [doc for doc, d_id in zip(batch_docs, batch_ids) if d_id not in existing_ids]
        new_ids  = [d_id for d_id in batch_ids if d_id not in existing_ids]

        if new_docs:
<<<<<<< HEAD
            print(f"[{min(i + batch_size, len(docs))}/{len(docs)}] Uploading {len(new_docs)} new chunks...")
            vectorstore = PineconeVectorStore(index_name=PINECONE_INDEX_NAME, embedding=embeddings)
            vectorstore.add_documents(new_docs, ids=new_ids)
        else:
            print(f"[{min(i + batch_size, len(docs))}/{len(docs)}] All chunks already exist. Skipping.")

    print(f"RAG Knowledge Base indexed in Pinecone: {PINECONE_INDEX_NAME}")


# RETRIEVAL (HYBRID: VECTOR + GRAPH)

def retrieve_vector_context(query, top_k=5):
    """Retrieves context using semantic vector search from Pinecone.
    
    Args:
        query (str): The user's search query.
        top_k (int): Number of most similar chunks to retrieve.
        
    Returns:
        list[Document]: A list of LangChain Document objects.
    """
    embeddings = get_embeddings()
    vectorstore = PineconeVectorStore(index_name=PINECONE_INDEX_NAME, embedding=embeddings)
    return vectorstore.similarity_search(query, k=top_k)


def retrieve_graph_context(query):
    """Retrieves context using the Neo4j Knowledge Graph.
    
    Identifies keywords from the query and performs lookups for:
    1. Entity-Entity triples (semantic facts).
    2. Employee-Employee communication links (frequency based).
    
    Args:
        query (str): The user's search query.
        
    Returns:
        list[str]: A list of formatted fact strings.
    """
    driver = get_neo4j_driver()
    knowledge_triples = []

    # Extract meaningful keywords for graph lookup
    keywords = [word.strip() for word in query.split() if len(word) > 3]

    try:
        with driver.session() as session:
            for kw in keywords:
                # 1: Semantic Entity Triples (e.g., Kenneth Lay -[CEO_OF]-> Enron)
                res = session.run("""
                    MATCH (n:Entity)
                    WHERE toLower(n.name) CONTAINS toLower($kw)
                    MATCH (n)-[r]->(related:Entity)
                    RETURN n.name AS source, type(r) AS rel, related.name AS target
                    LIMIT 5
                """, kw=kw)
                for record in res:
                    knowledge_triples.append(f"Fact: {record['source']} -[{record['rel']}]-> {record['target']}")

                # 2: Communication Network (e.g., A -[COMMUNICATES_WITH]-> B)
                res2 = session.run("""
                    MATCH (e:Employee)
                    WHERE toLower(e.name) CONTAINS toLower($kw) OR toLower(e.email) CONTAINS toLower($kw)
                    MATCH (e)-[r:COMMUNICATES_WITH]->(other:Employee)
                    RETURN e.name AS source, type(r) AS rel, other.name AS target, r.frequency AS freq
                    ORDER BY r.frequency DESC LIMIT 5
                """, kw=kw)
                for record in res2:
                    knowledge_triples.append(f"Fact: {record['source']} -[{record['rel']} x{record['freq']}]-> {record['target']}")
    except Exception as e:
        print(f"Graph Retrieval Error: {e}")
    finally:
        driver.close()

    return list(set(knowledge_triples))


def retrieve_hybrid_context(query):
    """Merges Vector snippets and Graph facts into a single context block for the LLM.
    
    Args:
        query (str): The user's search query.
        
    Returns:
        str: A concatenated string containing structured facts and semantic snippets.
    """
    print(f"\nQuery:'{query}'")
    
    # 1. Vector Search (Semantic)
    vector_docs = retrieve_vector_context(query)
    vector_context = "\n".join([f"- {doc.page_content}" for doc in vector_docs])
    # print(f"\n--- SEMANTIC SNIPPETS (Vector Search) ---\n{vector_context}\n")
    
    # 2. Graph Search (Structured)
    graph_facts = retrieve_graph_context(query)
    graph_context = "\n".join(graph_facts)
    # print(f"\n--- STRUCTURED KNOWLEDGE ---\n{graph_context}\n")

    
    # Format for the LLM
    full_context = f"--- STRUCTURED KNOWLEDGE ---\n{graph_context}\n\n--- SEMANTIC SNIPPETS ---\n{vector_context}"
    return full_context


# GENERATION (THE 'G' IN RAG)

def generate_answer(query):
    """Generates a final answer by synthesizing Hybrid context from Vector and Graph data.
    
    Orchestrates the retrieval of context and uses a LangChain ChatPromptTemplate 
    to generate a grounded, natural language response from the Gemini model.
    
    Args:
        query (str): The user's search query.
        
    Returns:
        str: The generated answer from the AI model.
    """
    context = retrieve_hybrid_context(query)
    
    # Initialize the Gemini model (using stable 3-flash)
    llm = ChatGoogleGenerativeAI(
        model="gemini-3-flash-preview",
        google_api_key=os.getenv("GEMINI_AI_API_KEY"),
        temperature=0
    )
    
    system_prompt = """
    You are an AI Enterprise Intelligence Assistant. 
    Use the provided contexts to answer the user's question accurately.
    - 'STRUCTURED KNOWLEDGE' contains direct facts from the Knowledge Graph.
    - 'SEMANTIC SNIPPETS' contains broader context from emails.
    Synthesize the information from both sources into a coherent answer.
    If the context doesn't contain enough information, state that clearly.
    """
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "Context:\n{context}\n\nQuestion: {query}")
    ])
    
    # Chain components: Prompt -> Model -> Text Parser
    parser = StrOutputParser()
    chain = prompt | llm | parser
    
    print("Generating Answer...")
    return chain.invoke({"context": context, "query": query})



if __name__ == "__main__":
    
    # Paths for internal Enron dataset
    EMAIL_PATH = "sample_email_by_category/sample_email.csv"

    # Argument handling
    if "--build" in sys.argv:
        build_vector_index(EMAIL_PATH)
    elif "--query" in sys.argv:
        question = " ".join(sys.argv[sys.argv.index("--query") + 1:])
        answer = generate_answer(question)
        
        # Output by llm
        print("Result:")
        print(answer)
    else:
        print("Usage:")
        print("  python miles3hybridRAG.py --build          (Build/Update Pinecone Index)")
        print("  python miles3hybridRAG.py --query \"Enter your question here\"")
=======
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
>>>>>>> recovery-branch
