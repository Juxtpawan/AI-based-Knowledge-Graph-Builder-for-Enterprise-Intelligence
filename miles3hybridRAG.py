"""Hybrid RAG Pipeline for Enterprise Intelligence.

This module implements a Retrieval-Augmented Generation (RAG) system that combines:
1. Semantic Search: Vector-based retrieval using Pinecone and Llama-embeddings.
2. Structured Retrieval: Graph-based context from Neo4j Knowledge Graph.
3. Generative Synthesis: Gemini-powered answer generation based on the hybrid context.

Key workflow:
- --build: Ingests email data into Pinecone.
- --query: Executes a hybrid search and generates a natural language answer.
"""

import os
import re
import sys
import time
import pandas as pd
import numpy as np
from dotenv import load_dotenv

# Neo4j and Pinecone core
from neo4j import GraphDatabase
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
    return RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50,
        length_function=len,
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
    clean_id = text.encode("ascii", "ignore").decode()
    clean_id = re.sub(r'[^a-zA-Z0-9\-_]', '_', clean_id)
    return clean_id


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
        pc.create_index(
            name=PINECONE_INDEX_NAME,
            dimension=1024, 
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1")
        )
        # Busy-wait until index is operational
        while not pc.describe_index(PINECONE_INDEX_NAME).status['ready']:
            time.sleep(1)

    embeddings = get_embeddings()
    splitter = get_text_splitter()
    docs = []
    doc_ids = []

    # --- Loading Emails ---
    if os.path.exists(email_csv):
        df = pd.read_csv(email_csv)
        print(f"Ingesting {len(df)} emails from {email_csv}...")
        for _, row in df.iterrows():
            # Only index the cleaned body to save cost/space
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
                # Generate a unique deterministic ID for each chunk
                safe_msg_id = format_pinecone_id(msg_id)
                doc_ids.append(f"email_{safe_msg_id}_{i}")

    if not docs:
        print("Error: No data found to index.")
        return

    print(f"Indexing {len(docs)} document chunks to Pinecone (Batch size: 100)...")

    batch_size = 100
    index = pc.Index(PINECONE_INDEX_NAME)

    for i in range(0, len(docs), batch_size):
        batch_docs = docs[i : i + batch_size]
        batch_ids = doc_ids[i : i + batch_size]

        # --- IDEMPOTENCY CHECK ---
        # Only upload what doesn't already exist to save Pinecone Write Units
        existing_ids = set()
        try:
            fetch_response = index.fetch(ids=batch_ids)
            existing_ids.update(fetch_response.vectors.keys())
        except Exception as e:
            print(f"Warning: Could not check existing IDs ({e}). Proceeding anyway.")

        new_docs = [doc for doc, d_id in zip(batch_docs, batch_ids) if d_id not in existing_ids]
        new_ids  = [d_id for d_id in batch_ids if d_id not in existing_ids]

        if new_docs:
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
