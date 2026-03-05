import os
import pandas as pd
from neo4j import GraphDatabase
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv

# Load your .env file (NEO4J, GEMINI, etc.)
load_dotenv()

# ==========================================
# 1. SETTINGS & EMBEDDING MODEL
# ==========================================
EMBED_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
LOCAL_MODEL_PATH = "./local_models/all-MiniLM-L6-v2"
INDEX_SAVE_PATH = "faiss_index_store"

def get_embeddings():
    """Load the local embedding model once."""
    model_path = LOCAL_MODEL_PATH if os.path.exists(LOCAL_MODEL_PATH) else EMBED_MODEL_NAME
    return HuggingFaceEmbeddings(model_name=model_path)

def get_text_splitter():
    """Breaks text into smaller searchable chunks."""
    return RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50,
        length_function=len,
        is_separator_regex=False,
    )

def get_neo4j_driver():
    """Initializes the Neo4j driver."""
    uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
    user = os.getenv("NEO4J_USER", "neo4j")
    password = os.getenv("NEO4J_PASSWORD", "password")
    return GraphDatabase.driver(uri, auth=(user, password))

# ==========================================
# 2. INGESTION (BUILD THE VECTOR KNOWLEDGE BASE)
# ==========================================
def build_vector_index(email_csv, entity_csv):
    """Indexes text data into FAISS."""
    embeddings = get_embeddings()
    splitter = get_text_splitter()
    docs = []

    # --- Loading Emails ---
    if os.path.exists(email_csv):
        df = pd.read_csv(email_csv)
        print(f"Indexing {len(df)} emails...")
        for _, row in df.iterrows():
            full_text = str(row['body_cleaned'])
            metadata = {"source": "email", "id": row['message_id'], "subject": row['subject']}
            chunks = splitter.split_text(full_text)
            for chunk in chunks:
                docs.append(Document(page_content=chunk, metadata=metadata))

    # --- Loading AI Entities ---
    if os.path.exists(entity_csv):
        df_ent = pd.read_csv(entity_csv)
        print(f"Indexing {len(df_ent)} extracted entities...")
        for _, row in df_ent.iterrows():
            context_text = f"Entity: {row['object']} (Type: {row['entity_type']}) Mentioned in Email {row['message_id']}"
            metadata = {"source": "entity", "name": row['object'], "id": row['message_id']}
            chunks = splitter.split_text(context_text)
            for chunk in chunks:
                docs.append(Document(page_content=chunk, metadata=metadata))

    if not docs:
        print("Error: No data found to index.")
        return

    vectorstore = FAISS.from_documents(docs, embeddings)
    vectorstore.save_local(INDEX_SAVE_PATH)
    print(f"✅ RAG Knowledge Base saved to: {INDEX_SAVE_PATH}")

# ==========================================
# 3. RETRIEVAL (THE HYBRID PART)
# ==========================================
def retrieve_vector_context(query, top_k=5):
    """Retrieves context using semantic vector search."""
    embeddings = get_embeddings()
    if not os.path.exists(INDEX_SAVE_PATH):
        return []
    vectorstore = FAISS.load_local(INDEX_SAVE_PATH, embeddings, allow_dangerous_deserialization=True)
    return vectorstore.similarity_search(query, k=top_k)

def retrieve_graph_context(query):
    """Retrieves context using Neo4j Knowledge Graph."""
    driver = get_neo4j_driver()
    knowledge_triples = []
    
    # Simple keyword-based extraction from query for Graph search
    keywords = [word.strip() for word in query.split() if len(word) > 4]
    
    try:
        with driver.session() as session:
            for kw in keywords:
                # Find entities related to keywords and their direct relationships
                res = session.run("""
                    MATCH (en:Entity)
                    WHERE en.name CONTAINS $kw
                    MATCH (en)-[r]->(related)
                    RETURN en.name AS source, type(r) AS rel, related.name AS target
                    LIMIT 10
                """, kw=kw)
                for record in res:
                    knowledge_triples.append(f"Fact: {record['source']} -[{record['rel']}]-> {record['target']}")
    finally:
        driver.close()
    
    return knowledge_triples

def retrieve_hybrid_context(query):
    """Combines Vector and Graph data."""
    print(f"\n🔍 Searching Hybrid Knowledge Base for: '{query}'...")
    
    # 1. Vector Search
    vector_docs = retrieve_vector_context(query)
    vector_context = "\n".join([f"- {doc.page_content}" for doc in vector_docs])
    
    # 2. Graph Search
    graph_facts = retrieve_graph_context(query)
    graph_context = "\n".join(graph_facts)
    
    full_context = f"--- STRUCTURED KNOWLEDGE ---\n{graph_context}\n\n--- SEMANTIC SNIPPETS ---\n{vector_context}"
    return full_context

# ==========================================
# 4. GENERATION (THE 'G' IN RAG)
# ==========================================
def generate_answer(query):
    """Generates an answer using the Hybrid context and Gemini LLM."""
    context = retrieve_hybrid_context(query)
    
    llm = ChatGoogleGenerativeAI(
        model="gemini-3-flash-preview",
        google_api_key=os.getenv("GEMINI_AI_API_KEY"),
        temperature=0.2,
        top_p=0.95,
        top_k=5
    )
    
    system_prompt = """
    You are an AI Enterprise Intelligence Assistant. 
    Use the provided contexts to answer the user's question accurately.
    - Treat 'STRUCTURED KNOWLEDGE' as facts from the Knowledge Graph.
    - Treat 'SEMANTIC SNIPPETS' as context from indexed emails.
    If you don't know the answer, say you don't know.
    """
    
    user_prompt = f"Context:\n{context}\n\nQuestion: {query}\n\nAnswer:"
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("user", user_prompt)
    ])
    
    chain = prompt | llm
    print("\n💡 Generating Answer...")
    response = chain.invoke({})
    return response.content

# ==========================================
# 5. MAIN ENTRY
# ==========================================
if __name__ == "__main__":
    import sys
    
    # Standard paths
    EMAIL_PATH = "sample_email_by_category/sample_email.csv"
    ENTITY_PATH = "NER/entities/entities.csv"

    if "--build" in sys.argv:
        build_vector_index(EMAIL_PATH, ENTITY_PATH)
    elif "--query" in sys.argv:
        question = " ".join(sys.argv[sys.argv.index("--query") + 1:])
        answer = generate_answer(question)
        print(f"\nFINAL ANSWER:\n{answer}")
    else:
        print("Usage:")
        print("  python rag_pipeline.py --build          (Build FAISS Index)")
        print("  python rag_pipeline.py --query \"Why did the project fail?\"")
