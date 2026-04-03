# Vidzai Backend — Intelligence Layer

The **Vidzai Backend** is a high-performance **FastAPI** application designed to power the Hybrid RAG (Retrieval-Augmented Generation) pipeline. It orchestrates intelligence extraction, graph traversal, vector retrieval, and LLM synthesis.

## 🏗️ Architecture Summary

### Core Components
- **FastAPI Engine**: Async-first API handles multiple concurrent forensic queries.
- **Hybrid RAG Orchestrator**: Merges structured graph context (Neo4j) with semantic vector context (Pinecone).
- **Gemini 3 Flash Interface**: Powers the Named Entity Recognition (NER) and final answer synthesis.
- **Async Services**: Dedicated background tasks for large-scale data ingestion and metrics computation.
- **WebSocket Gateway**: Real-time broadcasting of forensic signals and intelligence alerts to connected clients.

## 📁 Directory Structure
- **`main.py`**: Entry point and middleware configuration.
- **`miles3hybridRAG.py`**: The core LLM synthesis and retrieval logic.
- **`api/routers/`**: Segmented logic for Analytics, Curation, and Graph operations.
- **`services/`**: Focused business logic, including the `AnalyticsEngine`.
- **`models/`**: Pydantic schemas for strict data validation and documentation.
- **`notebooks/`**: The "Miles" series for step-by-step data transformation.
  - `miles1`: Data preprocessing & enrichment.
  - `miles2`: AI-driven entity & relationship extraction.
  - `miles3`: Hybrid RAG implementation and query logic.

## 🚀 Setting Up the Environment

### 1. Prerequisites
- Python 3.10+
- Virtual Environment tool (`venv` or)

### 2. Installation
```bash
python -m venv .venv
# Activate: .\.venv\Scripts\activate (Windows) or source .venv/bin/activate (Unix)
pip install -r requirements.txt
```

### 3. Configuration (`.env`)
The backend requires a `.env` file with:
- `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD`
- `PINECONE_API_KEY`, `PINECONE_INDEX_NAME`
- `GEMINI_AI_API_KEY`

## 📊 Feature Highlights

### Advanced Hybrid Retrieval
Vidzai's RAG doesn't just search text; it understands the topology of your data.
- **Step 1**: Vector retrieval finds semantically similar nodes.
- **Step 2**: Graph traversal explores 2-3 hops from those nodes to gather deep relationship context.
- **Step 3**: LLM (Gemini) synthesizes a unified answer from both direct matches and structural paths.

### Real-Time Analytics & Curation
Background services compute forensic distribution metrics over your Neo4j graph, powering the cognitive dashboards in the frontend.

The **Forensic Curation Protocol** (`/api/curation`) allows investigators to:
- **Validate** intelligence nodes with high-confidence markers.
- **Flag** anomalies for further manual review.
- **Mark** severe risks for immediate escalation.
- **Persist** metadata and audit trails directly into the knowledge graph.

---
