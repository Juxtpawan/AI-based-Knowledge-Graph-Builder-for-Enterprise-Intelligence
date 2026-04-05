"""
Centralised configuration for backend.
All environment variable reads happen here. Import this module
to access settings in any other module.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Base paths
BASE_DIR: Path = Path(__file__).resolve().parent
PROJECT_ROOT: Path = BASE_DIR.parent

# Neo4j
NEO4J_URI: str = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER: str = os.getenv("NEO4J_USER") or os.getenv("NEO4J_USERNAME") or "neo4j"
NEO4J_PASSWORD: str = os.getenv("NEO4J_PASSWORD", "password")

# Data files
DATA_FILE_PATH: str = os.getenv(
    "DATA_FILE_PATH",
    str(PROJECT_ROOT / "data" / "raw" / "emails.csv")
)
CHECKPOINT_FILE: str = os.getenv("CHECKPOINT_FILE", "extraction_checkpoint.json")
TOTAL_EMAIL_RECORDS: int = 517_401   # known Enron corpus size

# LLM / Vector DB
PINECONE_API_KEY: str = os.getenv("PINECONE_API_KEY", "")
GEMINI_API_KEY: str = os.getenv("GEMINI_AI_API_KEY") or os.getenv("GOOGLE_API_KEY") or os.getenv("GOOGLE_AI_API_KEY") or ""

# API settings
API_TITLE: str = "AI Based Knowledge Graph Builder"
_cors = os.getenv("CORS_ORIGINS", "*")
CORS_ORIGINS: list = [origin.strip() for origin in _cors.split(",")]

# Graph query limits
GRAPH_LIMIT_GLOBAL: int = 800
GRAPH_LIMIT_PROBE: int = 300
HEAVY_PROPS: list = ["body", "content", "text_content", "raw_data"]
