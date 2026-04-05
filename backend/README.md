# Vidzai Backend — Forensic Intelligence Layer

The **Vidzai Backend** is a high-performance **FastAPI** application designed to power the Hybrid RAG (Retrieval-Augmented Generation) pipeline. It orchestrates intelligence extraction, graph traversal, vector retrieval, and LLM synthesis.

## 🏗️ Architecture Summary

### Core Components
- **FastAPI Engine**: High-concurrency async service powering the investigation suite.
- **Hybrid RAG Orchestrator**: Merges structured graph context (Neo4j) with semantic vector context (Pinecone) using **Chain-of-Thought (CoT)** reasoning.
- **Gemini 3 Flash Interface**: Orchestrates NER, relationship extraction, and final ground-truth synthesis.
- **Async Services**: Fault-tolerant background workers for large-scale ingestion and real-time metric computation.
- **WebSocket Gateway**: Low-latency broadcasting of forensic signals and intelligence alerts (`Validated`, `Flagged`, `Risk`).

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
- **Step 1**: Vector retrieval via Pinecone finds semantically similar entry points.
- **Step 2**: Graph traversal in Neo4j explores 2-3 hops from those nodes to gather deep relationship context (Identity, Communication, Topic).
- **Step 3**: LLM (Gemini) executes **Chain-of-Thought (CoT)** reasoning with **strict grounding** to synthesize a unified answer from both direct matches and structural paths.

### Real-Time Analytics & Curation
Background services compute forensic distribution metrics over your Neo4j graph, powering the cognitive dashboards in the frontend.

The **Forensic Curation Protocol** (`/api/curation`) enables deep investigative persistence:
- **Validate**: Markers for high-confidence intelligence nodes.
- **Flag**: Immediate identification of anomalies for manual triage.
- **Risk**: Escalation of severe forensic signals.
- **Audit**: Every curation action persists investigator metadata and timestamps directly into the graph schema.

### Fault-Tolerant Retrieval
The backend implements **independent lookup logic** for Neo4j and Pinecone. This ensures that even if one retrieval vector experiences latency or a schema mismatch (e.g., missing indices), the other can still provide partial context to the LLM, preventing full system timeouts.

---
