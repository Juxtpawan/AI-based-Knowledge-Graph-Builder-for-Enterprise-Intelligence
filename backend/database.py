"""
database.py — Neo4j async driver lifecycle management.

Provides:
  - `lifespan(app)` — FastAPI lifespan context manager that opens/closes
    the driver and creates schema indices on startup.
  - `get_driver(request)` — helper to extract the driver from app state.
"""
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from neo4j import AsyncGraphDatabase

from config import NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD

# Neo4j schema indices to create on startup
_SCHEMA_QUERIES = [
    "CREATE INDEX employee_name_idx  IF NOT EXISTS FOR (n:Employee) ON (n.name)",
    "CREATE INDEX employee_email_idx IF NOT EXISTS FOR (n:Employee) ON (n.email)",
    "CREATE INDEX entity_name_idx    IF NOT EXISTS FOR (n:Entity)   ON (n.name)",
    "CREATE INDEX email_msg_id_idx   IF NOT EXISTS FOR (n:Email)    ON (n.message_id)",
    "CREATE INDEX email_subject_idx  IF NOT EXISTS FOR (n:Email)    ON (n.subject)",
    "CREATE CONSTRAINT email_unique_msg_id IF NOT EXISTS FOR (n:Email) REQUIRE n.message_id IS UNIQUE",
]


async def _connect(uri: str) -> AsyncGraphDatabase.driver:
    """Attempt to connect to Neo4j and verify with a ping."""
    driver = AsyncGraphDatabase.driver(uri, auth=(NEO4J_USER, NEO4J_PASSWORD))
    async with driver.session() as session:
        await session.run("RETURN 1")
    return driver


async def _build_schema(driver) -> None:
    """Ensure all performance-critical indices/constraints exist."""
    async with driver.session() as session:
        for query in _SCHEMA_QUERIES:
            await session.run(query)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan context manager.
    On startup:  connect to Neo4j, apply schema, record start time.
    On shutdown: close the driver.
    """
    app.state.start_time = time.time()
    driver = None

    # ── Primary connection ────────────────────────────────────────────────
    try:
        print(f"[DB] Connecting to Neo4j: {NEO4J_URI}")
        driver = await _connect(NEO4J_URI)
        print("[DB] Neo4j connected successfully.")
    except Exception as e:
        print(f"[DB] Primary connection failed: {e}")
        # ── Protocol fallback (neo4j:// → bolt://) ────────────────────────
        if NEO4J_URI.startswith("neo4j://"):
            fallback_uri = NEO4J_URI.replace("neo4j://", "bolt://")
            try:
                print(f"[DB] Trying fallback: {fallback_uri}")
                driver = await _connect(fallback_uri)
                print("[DB] Fallback connection successful.")
            except Exception as e2:
                print(f"[DB] Fallback also failed: {e2}")

    # ── Schema hardening ──────────────────────────────────────────────────
    if driver:
        try:
            print("[DB] Building schema indices...")
            await _build_schema(driver)
            print("[DB] Schema indices ONLINE.")
        except Exception as e:
            print(f"[DB] Schema warning: {e}")

    app.state.driver = driver
    yield

    # ── Shutdown ──────────────────────────────────────────────────────────
    if driver:
        await driver.close()
        print("[DB] Neo4j driver closed.")


def get_driver(request: Request):
    """Extract the shared Neo4j driver from app state."""
    return request.app.state.driver
