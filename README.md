# Vidzai: Enterprise Intelligence Platform with Hybrid RAG

<div align="center">

<!-- Badge Section -->
![Python](https://img.shields.io/badge/Python-3.10+-3776ab?style=flat-square&logo=python)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.95+-009688?style=flat-square&logo=fastapi)
![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

**Transform Unstructured Enterprise Data into Intelligent Knowledge Graphs**

[Features](#-features) • [Architecture](#-architecture) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [License](#-license)

</div>

---

## 🎯 About Vidzai

**Vidzai** is an enterprise-grade intelligence platform that revolutionizes how organizations extract insights from massive volumes of unstructured data. By combining advanced Large Language Models (LLMs), Knowledge Graphs, and Vector Retrieval, Vidzai transforms raw email communications into a sophisticated, queryable knowledge base.

### The Problem
- **Unstructured data chaos**: Enterprise communications are scattered across emails with no coherent structure
- **Knowledge silos**: Critical business intelligence is locked within unorganized documents
- **Slow insight extraction**: Traditional methods struggle to connect entities and relationships at scale

### The Solution
Vidzai leverages a **Hybrid RAG (Retrieval-Augmented Generation)** architecture that:
1. **Extracts intelligence** using Google Gemini AI for Named Entity Recognition (NER)
2. **Structures knowledge** in a Neo4j graph database with entity relationships
3. **Enables semantic search** via Pinecone vector embeddings
4. **Synthesizes insights** through an intelligent chat interface powered by LLM context fusion

---

## 🌟 Key Features

### 🤖 Intelligence Chat
- **Context-aware conversational AI** that understands domain-specific queries
- **Hybrid retrieval** combining semantic vector search and structured graph traversal
- **Multi-turn conversations** with memory of graph context
- **Real-time answer synthesis** using Gemini AI

### 📊 Graph Analytics Dashboard
- **Real-time entity distribution** visualization
- **Top communicators network** analysis
- **Data ingestion progress** tracking
- **Relationship mapping** visual explorer
- **Interactive dashboards** with Recharts and Force Graph rendering

### 🔌 Hybrid RAG Pipeline
- **End-to-end data processing** from raw emails to structured knowledge
- **AI-driven extraction** of 50+ entity types and relationship patterns
- **Scalable ingestion** to both graph and vector databases
- **Checkpointing & recovery** for long-running extraction jobs

### 🏗️ Enterprise Architecture
- **FastAPI backend** with production-grade error handling
- **CORS-enabled** for seamless frontend-backend communication
- **Async processing** capabilities for large-scale data handling
- **Database abstraction** supporting Neo4j and Pinecone

---

## 🛠️ Technology Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 19 | Modern UI library with hooks |
| **Vite** | 8.0 | Lightning-fast build tool |
| **Tailwind CSS** | 4.2 | Utility-first styling |
| **Framer Motion** | 12.38 | Smooth animations & transitions |
| **Recharts** | 3.8 | Data visualization charts |
| **Lucide Icons** | 1.7 | Beautiful SVG icons |
| **React Force Graph** | 1.29 | 2D/3D graph visualizations |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **FastAPI** | 0.95+ | High-performance async API |
| **Uvicorn** | Latest | ASGI web server |
| **Pydantic** | 2.0+ | Data validation & settings |
| **Python** | 3.10+ | Core language |

### Databases & AI
| Service | Role |
|---------|------|
| **Neo4j** | Graph database for entity relationships |
| **Pinecone** | Vector database for semantic search (1024-dim) |
| **Google Gemini 3 Flash** | LLM for NER, extraction, and synthesis |

### Data Processing
| Library | Purpose |
|---------|---------|
| **LangChain** | LLM orchestration & chain workflows |
| **LangChain Pinecone** | Vector store integration |
| **LangChain Google GenAI** | Gemini integration |
| **Pandas** | Data transformation & analysis |
| **NumPy** | Numerical operations |

---

## 🏗️ Architecture Overview

### System Diagram
```
┌─────────────────────────────────────────────────────────────────┐
│                    VIDZAI PLATFORM                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────┐      ┌──────────────────────────┐ │
│  │   FRONTEND (React/Vite)  │      │  BACKEND (FastAPI)       │ │
│  │  ┌────────────────────┐  │      │  ┌────────────────────┐  │ │
│  │  │ Intelligence Chat  │  │◄────►│  │ Query & RAG Engine │  │ │
│  │  │ Graph Analytics    │  │      │  │ Hybrid Retrieval   │  │ │
│  │  │ Dashboard          │  │      │  │ LLM Synthesis      │  │ │
│  │  └────────────────────┘  │      │  └────────────────────┘  │ │
│  └──────────────────────────┘      └──────────────────────────┘ │
│           (Port 5173)                     (Port 8000)            │
│                                                                   │
│                            ▲                                      │
│                            │ REST API                             │
│                            ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │        DATA PIPELINE (Jupyter Notebooks)                │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐        │   │
│  │  │  Miles1    │  │  Miles2    │  │  Miles3    │        │   │
│  │  │ Preprocess │  │ Extract    │  │ Graph      │        │   │
│  │  │  & Enrich  │  │ NER & Rel  │  │ Ingestion  │        │   │
│  │  └────────────┘  └────────────┘  └────────────┘        │   │
│  └─────────────────────────────────────────────────────────┘   │
│           Input: Enron Emails                                    │
│                                                                   │
│                            ▲                                      │
│                            │                                      │
│            ┌───────────────┴───────────────┐                     │
│            ▼                               ▼                     │
│  ┌──────────────────────┐    ┌──────────────────────┐           │
│  │   NEO4J GRAPH DB     │    │  PINECONE INDEX      │           │
│  │  (Entity Relations)  │    │  (Vector Embeddings) │           │
│  │                      │    │  (1024-dim, cosine)  │           │
│  └──────────────────────┘    └──────────────────────┘           │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Data Processing Pipeline

The **"Miles" series** represents the multi-stage transformation:

1. **Miles1** (`miles1.ipynb`): Data preprocessing & enrichment
   - Enron corpus ingestion with multi-encoding recovery
   - Multi-stage email body cleaning
   - Feature engineering (word counts, time-of-day, topic categories)

2. **Miles2** (`miles2extract_ent_rel.ipynb`): AI intelligence extraction
   - Named Entity Recognition (NER) using Gemini 3.1 Flash
   - Semantic relationship extraction
   - Output: Structured entity & relationship triples

3. **Miles3** (`miles3hybridRAG.py`): Knowledge synthesis
   - Hybrid search combining graph & vector retrieval
   - LLM-powered answer generation
   - Interactive querying interface

---

## 🚀 Quick Start

### Prerequisites

- **Python** 3.10 or higher
- **Node.js** 18 or higher
- **Neo4j Database** (local or [AuraDB](https://neo4j.com/cloud/aura/))
- **Pinecone Account** ([Create free](https://www.pinecone.io/))
- **Google Gemini API Key** ([Get here](https://ai.google.dev/))

### Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/Juxtpawan/AI-based-Knowledge-Graph-Builder-for-Enterprise-Intelligence.git
cd AI-based-Knowledge-Graph-Builder-for-Enterprise-Intelligence
```

#### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate (Windows)
.\.venv\Scripts\activate

# Activate (macOS/Linux)
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### 3. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install
```

#### 4. Environment Configuration

Create a `.env` file in the `backend/` directory:

```env
# Neo4j Configuration
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_secure_password

# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=email-knowledge-graph

# Google Gemini Configuration
GEMINI_AI_API_KEY=your_gemini_api_key

# Optional: Backend Settings
BACKEND_PORT=8000
FRONTEND_URL=http://localhost:5173
```

#### 5. Run the Project

**Option A: Automated (Windows)**
```powershell
.\start_project.ps1
```

**Option B: Manual (All Platforms)**

Terminal 1 - Backend:
```bash
cd backend
source .venv/bin/activate  # or .\.venv\Scripts\activate on Windows
python main.py
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

### Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs (Swagger UI)

---

## 📂 Project Structure

```
AI-based-Knowledge-Graph-Builder-for-Enterprise-Intelligence/
│
├── README.md                           # This file
├── LICENSE                             # MIT License
├── start_project.ps1                   # Windows startup script
├── .gitignore                          # Git ignore rules
│
├── backend/                            # FastAPI backend
│   ├── main.py                         # FastAPI application entry point
│   ├── miles3hybridRAG.py              # Hybrid RAG engine & query logic
│   ├── requirements.txt                # Python dependencies
│   ├── config.py                       # Environment configuration
│   ├── database.py                     # Neo4j connection management
│   ├── extraction_checkpoint.json      # Processing checkpoint (generated)
│   │
│   ├── notebooks/                      # Jupyter notebooks (Miles series)
│   │   ├── miles1.ipynb                # Data preprocessing & enrichment
│   │   ├── miles2extract_ent_rel.ipynb # NER & relationship extraction
│   │   └── miles2neo4j_storage.ipynb   # Neo4j graph ingestion
│   │
│   ├── api/                            # FastAPI routers
│   │   ├── routers/
│   │   │   ├── analytics.py            # Analytics endpoints
│   │   │   ├── curation.py             # Curation endpoints
│   │   │   └── graph.py                # Graph query endpoints
│   │   └── __init__.py
│   │
│   ├── models/                         # Pydantic models
│   │   ├── analytics.py
│   │   ├── curation.py
│   │   └── graph.py
│   │
│   ├── services/                       # Business logic
│   │   └── analytics_engine.py
│   │
│   └── logs/                           # Processing logs
│       ├── dataset_info.md
│       └── topic_summary.md
│
├── frontend/                           # React + Vite frontend
│   ├── index.html                      # HTML entry point
│   ├── package.json                    # NPM dependencies
│   ├── vite.config.js                  # Vite configuration
│   ├── eslint.config.js                # ESLint rules
│   │
│   ├── src/
│   │   ├── main.jsx                    # React entry point
│   │   ├── App.jsx                     # Main application component
│   │   ├── App.css                     # Application styles
│   │   ├── index.css                   # Global styles
│   │   │
│   │   ├── components/
│   │   │   ├── chat/
│   │   │   │   ├── ChatInput.jsx
│   │   │   │   ├── ChatMessage.jsx
│   │   │   │   ├── IntelligenceSidebar.jsx
│   │   │   │   └── ThoughtStepper.jsx
│   │   │   ├── dashboard/
│   │   │   │   ├── AlertFabric.jsx
│   │   │   │   ├── CognitiveFluxChart.jsx
│   │   │   │   ├── DashboardMetrics.jsx
│   │   │   │   └── KpiCard.jsx
│   │   │   ├── graph/
│   │   │   │   ├── BloomGraphCanvas.jsx
│   │   │   │   ├── CypherTerminal.jsx
│   │   │   │   ├── IntelligenceFilterPanel.jsx
│   │   │   │   └── StylingLegend.jsx
│   │   │   ├── search/
│   │   │   │   ├── CommandPalette.jsx
│   │   │   │   ├── ContextualSearch.jsx
│   │   │   │   ├── InvestigationBreadcrumbs.jsx
│   │   │   │   └── TopicSearchSidebar.jsx
│   │   │   ├── sidebar/
│   │   │   │   ├── EvidenceBag.jsx
│   │   │   │   ├── NodeIdentity.jsx
│   │   │   │   ├── SidebarAnalytics.jsx
│   │   │   │   ├── SidebarForensics.jsx
│   │   │   │   ├── SidebarMetadata.jsx
│   │   │   │   └── SidebarNodeInfo.jsx
│   │   │   └── ui/
│   │   │       ├── GlassContainer.jsx
│   │   │       └── StatusIndicator.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── NetworkView.jsx
│   │   │   ├── RagAgentChat.jsx
│   │   │   └── TopicExplorer.jsx
│   │   │
│   │   ├── services/
│   │   │   └── apiClient.js
│   │   │
│   │   └── store/
│   │       └── useIntelStore.js
│   │
│   └── public/                         # Static assets
│
└── data/                               # Data files
    ├── kg_data/                        # Knowledge graph data
    │   ├── entities.csv
    │   └── relationships.csv
    │
    └── processed/                      # Processed datasets
        ├── emails/
        │   └── README.md
        └── raw/
            ├── aggregated_communications.csv
            ├── communications.csv
            ├── email_enrichment_features.csv
            ├── emails_cleaned.csv
            ├── emails.csv
            ├── employee_metrics.csv
            └── employees.csv
```
    │   ├── main.jsx                    # React entry point
    │   ├── App.jsx                     # Main application component
    │   ├── App.css                     # Application styles
    │   ├── index.css                   # Global styles
    │   │
    │   ├── components/
    │   │   ├── ChatView.jsx            # Intelligence chat interface
    │   │   └── DashboardView.jsx       # Graph analytics dashboard
    │   │
    │   └── assets/                     # Images, icons, etc.
    │
    └── public/                         # Static assets
```

---

## 📚 Detailed Usage Guide

### Data Pipeline Workflow

#### Step 1: Prepare & Enrich Data
Open and run `backend/notebooks/miles1.ipynb`:
- Ingests raw Enron corpus (emails.csv)
- Applies multi-stage cleaning (encoding recovery, body sanitization)
- Generates analytical features (word count, time categorization, topics)
- Output: Enriched CSVs in `sample_email_by_category/`

#### Step 2: Extract AI Intelligence
Open and run `backend/notebooks/miles2extract_ent_rel.ipynb`:
- Uses Google Gemini 3.1 Flash for NER
- Extracts entities (Person, Organization, Location, etc.)
- Identifies semantic relationships (works_at, communicates_with, etc.)
- Output: Structured triples in `NER/entities/` and `NER/relationships/`

#### Step 3: Build Knowledge Graph
Open and run `backend/notebooks/miles2neo4j_storage.ipynb`:
- Transforms CSVs into Neo4j graph structure
- Creates 6-layer architecture:
  1. Identity profiles (Employees)
  2. Communication backbone (Emails)
  3. Entity nodes (Person, Org, Location)
  4. Relationship edges
  5. Email metadata
  6. AI-extracted intelligence
- Output: Populated Neo4j database

#### Step 4: Query with Hybrid RAG
Run `backend/main.py` and use the chat interface:
- Asks questions in natural language
- Backend retrieves:
  - **Vector results**: Similar embeddings from Pinecone
  - **Graph results**: Structured paths from Neo4j
- Gemini synthesizes unified, contextual answers

### API Endpoints Reference

| Endpoint | Method | Request | Response |
|----------|--------|---------|----------|
| `/` | GET | - | `{"message": "API running"}` |
| `/query` | POST | `{"query": "string"}` | `{"answer": "string"}` |
| `/metrics` | GET | - | `MetricsResponse` |
| `/docs` | GET | - | Swagger UI |

---

## 🔧 Configuration & Customization

### Embedding Model Configuration
Edit `backend/miles3hybridRAG.py`:
```python
PINECONE_INDEX_NAME = "email-knowledge-graph"
EMBED_MODEL_NAME = "llama-text-embed-v2"  # 1024 dimensions
```

### Text Splitter Settings
Customize chunk size in `get_text_splitter()`:
```python
RecursiveCharacterTextSplitter(
    chunk_size=500,      # Adjust for domain specificity
    chunk_overlap=50,    # Context preservation
)
```

### Tailor Entity Types
Modify the NER prompt in `miles2extract_ent_rel.ipynb` to match your domain (currently optimized for enterprise emails).

---

## 🚀 Performance Optimization

### For Large Datasets
- **Batch processing**: Process emails in chunks (e.g., 1000 at a time)
- **Checkpointing**: Use `extraction_checkpoint.json` to resume failed jobs
- **Index optimization**: Use Pinecone's sparse-dense hybrid index for better recall

### Database Tuning
- **Neo4j**: Add indexes on frequently queried properties (e.g., entity name, email sender)
- **Pinecone**: Tune pod type and replicas based on QPS requirements

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| `ModuleNotFoundError: No module named 'neo4j'` | Run `pip install -r requirements.txt` in activated venv |
| Neo4j connection refused | Ensure Neo4j service is running; check URI in `.env` |
| Pinecone index not found | Create index with 1024 dimensions, cosine metric |
| CORS errors in browser | Verify FastAPI CORS middleware includes frontend URL |
| Slow query responses | Check Neo4j query performance; add database indexes |
| API returns 500 error | Check backend logs; verify all API keys in `.env` |

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📖 Resource Links

- **Neo4j Documentation**: https://neo4j.com/docs/
- **Pinecone Documentation**: https://docs.pinecone.io/
- **Google Gemini API**: https://ai.google.dev/
- **LangChain Documentation**: https://python.langchain.com/
- **FastAPI Tutorial**: https://fastapi.tiangolo.com/
- **React Documentation**: https://react.dev/
- **Retrieval-Augmented Generation Paper**: https://arxiv.org/abs/2005.11401

---

## 📝 Citation

If you use Vidzai in research or production, please cite:

```bibtex
@software{vidzai2024,
  title={Vidzai: Enterprise Intelligence Platform with Hybrid RAG},
  author={Pawan},
  year={2024},
  url={https://github.com/Juxtpawan/AI-based-Knowledge-Graph-Builder-for-Enterprise-Intelligence}
}
```

---

## ⚖️ License

This project is distributed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

### Attribution
- **Dataset**: Enron Corpus (public domain)
- **LLM**: Google Gemini 3 Flash Preview
- **Technologies**: FastAPI, React, Neo4j, Pinecone, LangChain

---

## 🎓 Learning Resources

### Key Concepts
- **Knowledge Graphs**: Structured representation of entities and relationships
- **RAG (Retrieval-Augmented Generation)**: Hybrid retrieval + LLM-based synthesis
- **Vector Embeddings**: Semantic representation for similarity search
- **Named Entity Recognition (NER)**: Automatic entity extraction from text

### Related Papers
1. "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks" - Lewis et al. (2020)
2. "Knowledge Graphs" - Hogan et al. (2021)
3. "Dense Passage Retrieval for Open-Domain Question Answering" - Karpukhin et al. (2020)

---

## 👨‍💻 Author & Support

**Created by**: [Pawan Sharma](https://github.com/Juxtpawan)

For issues, feature requests, or questions:
- Open an [Issue](https://github.com/Juxtpawan/AI-based-Knowledge-Graph-Builder-for-Enterprise-Intelligence/issues)
- Start a [Discussion](https://github.com/Juxtpawan/AI-based-Knowledge-Graph-Builder-for-Enterprise-Intelligence/discussions)

---

<div align="center">

**⭐ If you find this project helpful, please star it!**

Made with ❤️ for enterprise intelligence

</div>
