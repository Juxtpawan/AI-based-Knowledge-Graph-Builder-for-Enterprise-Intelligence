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
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from dotenv import load_dotenv
from pathlib import Path


# Neo4j and Pinecone core
from neo4j import GraphDatabase, AsyncGraphDatabase
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

def get_embeddings():
    return PineconeEmbeddings(model=EMBED_MODEL_NAME)

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
    # Note: verify_connectivity is harder in a simple factory for async, 
    # but the driver itself will handle the URI we pass.
    # We will try to be smart about the protocol.
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
    embeddings = get_embeddings()
    vectorstore = PineconeVectorStore(index_name=PINECONE_INDEX_NAME, embedding=embeddings)
    return vectorstore.similarity_search(query, k=top_k)

def filter_keywords(query):
    """Processes query into high-signal keywords using NLTK."""
    try:
        stop_words = set(stopwords.words('english'))
        word_tokens = word_tokenize(query)
        return [w for w in word_tokens if not w.lower() in stop_words and len(w) > 2]
    except Exception as e:
        print(f"NLTK Processing Error: {e}. Falling back to simple split.")
        return [word.strip() for word in query.split() if len(word) > 3]

async def retrieve_graph_context_async(query):
    driver = get_async_neo4j_driver()
    knowledge_triples = []
    
    # Advanced NLTK Tokenization & Stopword Removal
    keywords = filter_keywords(query)

    try:
        async with driver.session() as session:
            for kw in keywords:
                # 1: Semantic Entity Triples
                res = await session.run("""
                    MATCH (n:Entity)
                    WHERE toLower(n.name) CONTAINS toLower($kw)
                    MATCH (n)-[r]->(related:Entity)
                    RETURN n.name AS source, type(r) AS rel, related.name AS target
                    LIMIT 5
                """, kw=kw)
                async for record in res:
                    knowledge_triples.append(f"Fact: {record['source']} -[{record['rel']}]-> {record['target']}")

                # 2: Communication Network
                res2 = await session.run("""
                    MATCH (e:Employee)
                    WHERE toLower(e.name) CONTAINS toLower($kw) OR toLower(e.email) CONTAINS toLower($kw)
                    MATCH (e)-[r:COMMUNICATES_WITH]->(other:Employee)
                    RETURN e.name AS source, type(r) AS rel, other.name AS target, r.frequency AS freq
                    ORDER BY r.frequency DESC LIMIT 5
                """, kw=kw)
                async for record in res2:
                    knowledge_triples.append(f"Fact: {record['source']} -[{record['rel']} x{record['freq']}]-> {record['target']}")
    except Exception as e:
        print(f"Graph Retrieval Error: {e}")
    finally:
        await driver.close()

    return list(set(knowledge_triples))

# For legacy sync support
def retrieve_graph_context(query):
    return asyncio.run(retrieve_graph_context_async(query))

async def retrieve_hybrid_context_async(query):
    # Parallelize context retrieval for performance
    print(f"Pulling Intelligence for: {query}")
    
    # 1. Vector Search (LangChain Pinecone is synchronous)
    try:
        vector_docs = retrieve_vector_context(query)
        vector_context = "\n".join([f"- {doc.page_content}" for doc in vector_docs])
    except Exception as e:
        print(f"Vector Retrieval Error: {e}")
        vector_context = "Vector store unavailable."

    # 2. Graph Retrieval (Async)
    graph_facts = await retrieve_graph_context_async(query)
    graph_context = "\n".join(graph_facts)

    return (
        f"--- STRUCTURED KNOWLEDGE (Neo4j) ---\n{graph_context}\n\n"
        f"--- SEMANTIC SNIPPETS (Emails) ---\n{vector_context}"
    )

# --- GENERATION ---

async def generate_answer_async(query):
    context = await retrieve_hybrid_context_async(query)
    
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
    return await chain.ainvoke({"context": context, "query": query})

# Sync wrapper for existing calls
def generate_answer(query):
    return asyncio.run(generate_answer_async(query))

if __name__ == "__main__":
    BASE_DIR = Path(__file__).resolve().parent.parent
    EMAIL_PATH = str(BASE_DIR / "data" / "processed" / "emails" / "sample_email.csv")
    
    if "--build" in sys.argv:
        build_vector_index(EMAIL_PATH)
    elif "--query" in sys.argv:
        question = " ".join(sys.argv[sys.argv.index("--query") + 1:])
        answer = generate_answer(question)
        print(f"Result:\n{answer}")
