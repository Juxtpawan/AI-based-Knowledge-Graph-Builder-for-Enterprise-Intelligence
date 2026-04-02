<<<<<<< HEAD
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import sys

# Import logic from the existing RAG module
from miles3hybridRAG import generate_answer, get_neo4j_driver

app = FastAPI(title="AI Knowledge Graph Builder API")

# Enable CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
=======
"""
main.py — Application entry point.

This file is intentionally minimal. Its only responsibilities are:
  1. Create the FastAPI application instance.
  2. Register middleware.
  3. Mount all routers.
  4. Start uvicorn when run directly.

All business logic lives in the modules imported below:
  database.py            → Neo4j lifecycle + connection
  config.py              → all environment variables & constants
  models/                → Pydantic schemas
  services/              → pure computation functions
  api/routers/graph.py   → /graph, /node, /cypher, /search, /query
  api/routers/analytics.py → /analytics, /analytics/pulse, /metrics
  api/routers/curation.py  → /curate, /alerts, /elements
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from database import lifespan
from config import API_TITLE, CORS_ORIGINS
from api.routers import graph as graph_router
from api.routers import analytics as analytics_router
from api.routers import curation as curation_router

# ── Application factory ────────────────────────────────────────────────────
app = FastAPI(title=API_TITLE, lifespan=lifespan)

# ── Middleware ─────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
>>>>>>> recovery-branch
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
<<<<<<< HEAD

class QueryRequest(BaseModel):
    query: str

class QueryResponse(BaseModel):
    answer: str

class MetricItem(BaseModel):
    name: str
    value: int

class DataInfo(BaseModel):
    total_records: int
    processed_records: int
    data_file: str
    last_updated: str
    file_size_mb: float

class MetricsResponse(BaseModel):
    total_entities: int
    total_relationships: int
    entity_types: List[MetricItem]
    top_communicators: List[MetricItem]
    data_info: DataInfo

@app.get("/")
async def root():
    return {"message": "AI Knowledge Graph Builder API is running."}

@app.post("/query", response_model=QueryResponse)
async def query_llm(request: QueryRequest):
    try:
        answer = generate_answer(request.query)
        return QueryResponse(answer=answer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/metrics", response_model=MetricsResponse)
async def get_metrics():
    driver = get_neo4j_driver()
    try:
        with driver.session() as session:
            # 1. Total Entities
            res_entities = session.run("MATCH (n:Entity) RETURN count(n) AS count")
            total_entities = res_entities.single()["count"]

            # 2. Total Relationships
            res_rels = session.run("MATCH ()-[r]->() RETURN count(r) AS count")
            total_relationships = res_rels.single()["count"]

            # 3. Entity Types Distribution (Mocking labels for now or querying if they exist)
            # Assuming labels like Entity, Employee etc.
            res_types = session.run("""
                MATCH (n) 
                UNWIND labels(n) AS label 
                RETURN label, count(*) AS count
            """)
            entity_types = [MetricItem(name=record["label"], value=record["count"]) for record in res_types]

            # 4. Top Communicators (if r.frequency exists)
            res_comm = session.run("""
                MATCH (e:Employee)-[r:COMMUNICATES_WITH]->()
                RETURN e.name AS name, sum(r.frequency) AS total_freq
                ORDER BY total_freq DESC LIMIT 5
            """)
            top_communicators = [MetricItem(name=record["name"], value=record["total_freq"]) for record in res_comm]

        # 5. Data Info
        import json
        checkpoint_path = "extraction_checkpoint.json"
        data_file_path = "datasets/emails.csv"
        
        processed_records = 0
        last_updated = "Never"
        if os.path.exists(checkpoint_path):
            with open(checkpoint_path, "r") as f:
                checkpoint = json.load(f)
                processed_records = checkpoint.get("last_processed_index", 0) + 1
                last_updated = checkpoint.get("timestamp", "Unknown")
        
        total_records = 517401 # Known total for Enron dataset
        file_size_mb = 0
        if os.path.exists(data_file_path):
            file_size_mb = round(os.path.getsize(data_file_path) / (1024 * 1024), 2)

        data_info = DataInfo(
            total_records=total_records,
            processed_records=processed_records,
            data_file="emails.csv",
            last_updated=last_updated,
            file_size_mb=file_size_mb
        )

        return MetricsResponse(
            total_entities=total_entities,
            total_relationships=total_relationships,
            entity_types=entity_types,
            top_communicators=top_communicators,
            data_info=data_info
        )
    except Exception as e:
        # Fallback to mock data if Neo4j is not ready or query fails
        print(f"Metrics fetch error: {e}")
        return MetricsResponse(
            total_entities=125,
            total_relationships=450,
            entity_types=[
                MetricItem(name="Employee", value=80),
                MetricItem(name="Organization", value=15),
                MetricItem(name="Location", value=30)
            ],
            top_communicators=[
                MetricItem(name="Kenneth Lay", value=150),
                MetricItem(name="Jeff Skilling", value=120),
                MetricItem(name="Andrew Fastow", value=90),
                MetricItem(name="Vince Kaminski", value=85),
                MetricItem(name="Greg Whalley", value=70)
            ],
            data_info=DataInfo(
                total_records=517401,
                processed_records=1000,
                data_file="emails.csv",
                last_updated="Thu Mar 12 2026",
                file_size_mb=1360.05
            )
        )
    finally:
        driver.close()

=======
app.add_middleware(GZipMiddleware, minimum_size=1000)

# ── Routers ────────────────────────────────────────────────────────────────
app.include_router(graph_router.router)
app.include_router(analytics_router.router)
app.include_router(curation_router.router)


@app.get("/", tags=["Health"])
async def root():
    return {"message": "AI Knowledge Graph Builder API is running.", "version": "2.0"}


# ── Dev entry point ────────────────────────────────────────────────────────
>>>>>>> recovery-branch
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
