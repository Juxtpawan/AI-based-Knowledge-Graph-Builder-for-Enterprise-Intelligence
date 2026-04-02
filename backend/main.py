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
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# ── Routers ────────────────────────────────────────────────────────────────
app.include_router(graph_router.router)
app.include_router(analytics_router.router)
app.include_router(curation_router.router)


@app.get("/", tags=["Health"])
async def root():
    return {"message": "AI Knowledge Graph Builder API is running.", "version": "2.0"}


# ── Dev entry point ────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
