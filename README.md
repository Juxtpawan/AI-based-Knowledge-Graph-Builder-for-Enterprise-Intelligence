# Vidzai: AI-Based Knowledge Graph & Hybrid RAG

Vidzai is a premium enterprise intelligence platform that transforms massive, unstructured data (like the Enron email corpus) into a structured Knowledge Graph and a high-performance Hybrid RAG (Retrieval-Augmented Generation) system.

![Dashboard Preview](/C:/Users/pawan/.gemini/antigravity/brain/a60ac386-79dd-4a37-8927-31af4d7d78ec/dashboard_preview.png)

## 🌟 Key Features

- **Intelligence Chat**: A context-aware AI assistant that synthesizes answers by combining semantic vector search (Pinecone) and structured graph traversal (Neo4j).
- **Graph Analytics**: A real-time dashboard visualizing entity distribution, top communicators, and ingestion progress.
- **Hybrid RAG Pipeline**: An end-to-end data processing engine using Gemini AI for Named Entity Recognition (NER) and relationship extraction.

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS 4, Framer Motion, Recharts, Lucide Icons.
- **Backend**: FastAPI, Uvicorn, Pydantic, Pandas.
- **Database**: Neo4j (Graph), Pinecone (Vector).
- **AI/LLM**: Google Gemini 3 Flash Preview, LangChain.

## 🚀 Getting Started

### 1. Prerequisites

- **Python 3.10+** & **Node.js 18+**
- **Neo4j Instance** (Local or AuraDB)
- **Pinecone Index** (1024 dimensions, cosine metric)
- **API Keys**: Google Gemini & Pinecone API.

### 2. Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Juxtpawan/AI-based-Knowledge-Graph-Builder-for-Enterprise-Intelligence.git
   cd AI-based-Knowledge-Graph-Builder-for-Enterprise-Intelligence
   ```

2. **Backend Setup**:
   ```bash
   cd backend
   python -m venv .venv
   .\.venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Frontend Setup**:
   ```bash
   cd ../frontend
   npm install
   ```

### 3. Configuration

Create a `.env` file in the `backend/` directory:
```env
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password

GEMINI_AI_API_KEY=your_gemini_key
PINECONE_API_KEY=your_pinecone_key
```

### 4. Running the Project

In the project root, run the convenience PowerShell script:
```powershell
.\start_project.ps1
```
*Alternatively, run `npm run dev` in `frontend/` and `python main.py` in `backend/`.*

## 📂 Project Structure

- `frontend/`: React dashboard and chat interface.
- `backend/`: FastAPI server and RAG logic.
- `backend/notebooks/`: Data ingestion and AI extraction pipeline (The "Miles" series).
- `backend/datasets/`: Raw data storage (e.g., `emails.csv`).
- `backend/NER/`: Structured entity and relationship triples.

## ⚖️ License

Distributed under the MIT License. See `LICENSE` for more information.
