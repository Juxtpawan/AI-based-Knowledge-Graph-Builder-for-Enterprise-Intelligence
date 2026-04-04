"""
main.py — Application entry point.

This file is intentionally minimal. Its only responsibilities are:
  1. Create the FastAPI application instance.
  2. Register middleware.
  3. Mount all routers.
  4. Start uvicorn when run directly.

All business logic lives in the modules imported below:
  database.py             → Neo4j lifecycle + connection
  config.py               → all environment variables & constants
  models/                 → Pydantic schemas
  services/               → pure computation functions
  api/routers/graph.py    → /graph, /node, /cypher, /search, /query
  api/routers/analytics.py → /analytics, /analytics/pulse, /metrics
  api/routers/curation.py  → /curate, /alerts, /elements
"""
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from database import lifespan
from config import API_TITLE, CORS_ORIGINS
from api.routers import graph as graph_router
from api.routers import analytics as analytics_router
from api.routers import curation as curation_router
from api.routers import node_analytics as node_analytics_router
from api.socket_manager import manager
from api.routers.analytics import fetch_real_time_snapshot
import asyncio

# Application factory
app = FastAPI(title=API_TITLE, lifespan=lifespan)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Routers
app.include_router(graph_router.router)
app.include_router(analytics_router.router)
app.include_router(curation_router.router)
app.include_router(node_analytics_router.router)

# WebSocket Analytics Stream
@app.websocket("/ws/analytics")
async def websocket_analytics(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send initial snapshot on connect
        driver = app.state.driver
        start_time = app.state.start_time
        if driver:
            snapshot = await fetch_real_time_snapshot(driver, start_time)
            if snapshot:
                await websocket.send_json(snapshot)
        
        while True:
            # Keep connection alive, listen for client pings if needed
            data = await websocket.receive_text()
    except Exception:
        pass
    finally:
        manager.disconnect(websocket)

# Background Intelligence Pulse
async def analytics_pulse_worker():
    """
    Background worker that broadcasts Neo4j & Pipeline updates
    to all connected WebSocket clients every 5 seconds.
    """
    print("[SYSTEM] Starting Real-Time Intelligence Pulse worker...")
    while True:
        try:
            if hasattr(app.state, 'driver') and app.state.driver:
                snapshot = await fetch_real_time_snapshot(app.state.driver, app.state.start_time)
                if snapshot:
                    await manager.broadcast(snapshot)
        except Exception as e:
            print(f"[PULSE] Worker Error: {e}")
        
        await asyncio.sleep(5) # Pulse every 5 seconds

@app.on_event("startup")
async def start_pulse_worker():
    asyncio.create_task(analytics_pulse_worker())


@app.get("/", tags=["Health"])
async def root():
    return {"message": "AI Knowledge Graph Builder API is running.", "version": "2.0"}



if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
