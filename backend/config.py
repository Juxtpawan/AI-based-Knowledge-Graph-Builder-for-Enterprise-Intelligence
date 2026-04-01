import os
from dotenv import load_dotenv

def load_config():
    """Loads environment variables from the .env file."""
    load_dotenv()
    
    # Optional: Retrieve some core variables here if needed dynamically
    return {
        "neo4j_uri": os.getenv("NEO4J_URI", "bolt://localhost:7687"),
        "neo4j_user": os.getenv("NEO4J_USER", "neo4j"),
        "pinecone_api_key": os.getenv("PINECONE_API_KEY"),
        "gemini_api_key": os.getenv("GEMINI_AI_API_KEY")
    }

# Run once on import to ensure env vars are applied system-wide
load_config()
