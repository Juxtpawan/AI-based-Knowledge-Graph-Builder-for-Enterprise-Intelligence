import os
import json
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from neo4j import AsyncGraphDatabase

# Import logic from the existing RAG module
from miles3hybridRAG import generate_answer, filter_keywords
from neo4j.graph import Node, Relationship, Path

from pathlib import Path

# --- Configuration & State ---
BASE_DIR = Path(__file__).resolve().parent.parent
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "password")
DATA_FILE_PATH = os.getenv("DATA_FILE_PATH", str(BASE_DIR / "data" / "raw" / "emails.csv"))

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize Async Driver with Fallback
    driver = None
    try:
        print(f"Connecting to Neo4j: {NEO4J_URI}...")
        driver = AsyncGraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
        # Basic check
        async with driver.session() as session:
            await session.run("RETURN 1")
        print("Neo4j Connected successfully.")
    except Exception as e:
        print(f"Neo4j Primary Connection Failed: {e}")
        if NEO4J_URI.startswith("neo4j://"):
            fallback_uri = NEO4J_URI.replace("neo4j://", "bolt://")
            print(f"Attempting Protocol Fallback to: {fallback_uri}")
            try:
                driver = AsyncGraphDatabase.driver(fallback_uri, auth=(NEO4J_USER, NEO4J_PASSWORD))
                async with driver.session() as session:
                    await session.run("RETURN 1")
                print("Fallback successful. Using BOLT direct connection.")
            except Exception as e2:
                print(f"Fallback Failed: {e2}")
    
    app.state.driver = driver
    yield
    if driver:
        await driver.close()

app = FastAPI(
    title="AI Knowledge Graph Builder API - NextGen Edition",
    lifespan=lifespan
)

# Enable CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# --- Pydantic Models ---

class QueryRequest(BaseModel):
    query: str

class QueryResponse(BaseModel):
    answer: str

class CypherRequest(BaseModel):
    query: str

class CurationRequest(BaseModel):
    element_id: str
    is_node: bool
    status: str # 'verified' | 'flagged' | 'neutral'
    severity: str = "Low" # 'Critical' | 'High' | 'Medium' | 'Low'
    category: str = "None"
    note: str = ""

class AlertItem(BaseModel):
    title: str
    severity: str
    category: str
    detail: str

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

class GraphNode(BaseModel):
    id: str
    labels: List[str]
    properties: Dict[str, Any]

class GraphRelationship(BaseModel):
    id: str
    type: str
    from_node: str = Field(alias='from')
    to_node: str = Field(alias='to')
    properties: Dict[str, Any]
    model_config = ConfigDict(populate_by_name=True)

class GraphResponse(BaseModel):
    nodes: List[Dict[str, Any]]
    relationships: List[Dict[str, Any]]

class SuggestionResponse(BaseModel):
    suggestions: List[Dict[str, Any]]

# --- Endpoints ---

@app.get("/")
async def root():
    return {"message": "AI Knowledge Graph Builder API is running."}

@app.post("/curate")
async def curate_element(request: Request, body: CurationRequest):
    driver = request.app.state.driver
    try:
        async with driver.session() as session:
            if body.is_node:
                query = """
                MATCH (n) WHERE elementId(n) = $id
                SET n.curation_status = $status,
                    n.curation_severity = $severity,
                    n.curation_category = $category,
                    n.curation_note = $note
                RETURN n
                """
            else:
                query = """
                MATCH ()-[r]->() WHERE elementId(r) = $id
                SET r.curation_status = $status,
                    r.curation_severity = $severity,
                    r.curation_category = $category,
                    r.curation_note = $note
                RETURN r
                """
            
            res = await session.run(query, 
                id=body.element_id, 
                status=body.status,
                severity=body.severity,
                category=body.category,
                note=body.note
            )
            record = await res.single()
            if not record:
                raise HTTPException(status_code=404, detail="Element not found")
            return {"status": "success", "element_id": body.element_id}
    except Exception as e:
        print(f"Curation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/alerts", response_model=List[AlertItem])
async def get_alerts(request: Request):
    driver = request.app.state.driver
    alerts = []
    try:
        async with driver.session() as session:
            # Get flagged nodes
            node_query = """
            MATCH (n) WHERE n.curation_status = 'flagged'
            RETURN n.name AS name, n.curation_severity AS severity, n.curation_category AS category, n.curation_note AS note, labels(n) AS labels
            """
            res = await session.run(node_query)
            async for record in res:
                alerts.append(AlertItem(
                    title=f"Node Anomaly: {record['name'] or record['labels'][0]}",
                    severity=record['severity'],
                    category=record['category'],
                    detail=record['note']
                ))
            
            # Get flagged relationships
            rel_query = """
            MATCH (s)-[r]->(t) WHERE r.curation_status = 'flagged'
            RETURN type(r) AS type, r.curation_severity AS severity, r.curation_category AS category, r.curation_note AS note, s.name AS source, t.name AS target
            """
            res = await session.run(rel_query)
            async for record in res:
                alerts.append(AlertItem(
                    title=f"Rel Anomaly: {record['source']} -> {record['type']} -> {record['target']}",
                    severity=record['severity'],
                    category=record['category'],
                    detail=record['note']
                ))
        return alerts
    except Exception as e:
        print(f"Alerts fetch error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/elements/{element_id}")
async def delete_element(request: Request, element_id: str, is_node: bool = Query(True)):
    driver = request.app.state.driver
    try:
        async with driver.session() as session:
            if is_node:
                # Detach delete to handle relationships
                query = "MATCH (n) WHERE elementId(n) = $id DETACH DELETE n RETURN count(n) AS deleted_count"
            else:
                query = "MATCH ()-[r]->() WHERE elementId(r) = $id DELETE r RETURN count(r) AS deleted_count"
            
            res = await session.run(query, id=element_id)
            record = await res.single()
            if record["deleted_count"] == 0:
                raise HTTPException(status_code=404, detail="Element not found")
            return {"status": "success", "message": "Element pruned from graph"}
    except Exception as e:
        print(f"Pruning error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/query", response_model=QueryResponse)
async def query_llm(request: QueryRequest):
    try:
        # Note: generate_answer is currently sync, might be a future bottleneck to make async
        answer = generate_answer(request.query)
        return QueryResponse(answer=answer)
    except Exception as e:
        print(f"RAG Query Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/metrics", response_model=MetricsResponse)
async def get_metrics(request: Request):
    driver = request.app.state.driver
    try:
        async with driver.session() as session:
            query = """
            CALL {
                MATCH (n:Entity) RETURN count(n) AS total_entities
            }
            CALL {
                MATCH ()-[r]->() RETURN count(r) AS total_relationships
            }
            MATCH (n)
            UNWIND labels(n) AS label
            WITH label, count(*) AS label_count, total_entities, total_relationships
            WITH collect({name: label, value: label_count}) AS entity_types, total_entities, total_relationships
            MATCH (e:Employee)-[r:COMMUNICATES_WITH]->()
            WITH e.name AS name, sum(r.frequency) AS total_freq, entity_types, total_entities, total_relationships
            ORDER BY total_freq DESC LIMIT 8
            RETURN total_entities, total_relationships, entity_types, collect({name: name, value: total_freq}) AS top_communicators
            """
            result = await session.run(query)
            record = await result.single()
            
            if not record:
                return MetricsResponse(
                    total_entities=0, total_relationships=0, entity_types=[], top_communicators=[],
                    data_info=DataInfo(total_records=0, processed_records=0, data_file="", last_updated="", file_size_mb=0)
                )

        # File system info
        checkpoint_path = "extraction_checkpoint.json"
        processed_records = 0
        last_updated = "Never"
        if os.path.exists(checkpoint_path):
            with open(checkpoint_path, "r") as f:
                checkpoint = json.load(f)
                processed_records = checkpoint.get("last_processed_index", 0) + 1
                last_updated = checkpoint.get("timestamp", "Unknown")
        
        total_records = 517401 
        file_size_mb = 0
        if os.path.exists(DATA_FILE_PATH):
            file_size_mb = round(os.path.getsize(DATA_FILE_PATH) / (1024 * 1024), 2)

        data_info = DataInfo(
            total_records=total_records, processed_records=processed_records,
            data_file="emails.csv", last_updated=last_updated, file_size_mb=file_size_mb
        )

        return MetricsResponse(
            total_entities=record["total_entities"],
            total_relationships=record["total_relationships"],
            entity_types=[MetricItem(**item) for item in record["entity_types"]],
            top_communicators=[MetricItem(**item) for item in record["top_communicators"]],
            data_info=data_info
        )
    except Exception as e:
        print(f"Metrics fetch error: {e}")
        return MetricsResponse(total_entities=0, total_relationships=0, entity_types=[], top_communicators=[], 
                               data_info=DataInfo(total_records=0, processed_records=0, data_file="", last_updated="", file_size_mb=0))

@app.post("/cypher", response_model=GraphResponse)
async def run_cypher(request: Request, body: CypherRequest):
    driver = request.app.state.driver
    nodes_map = {}
    rels_list = []
    HEAVY_PROPS = ['body', 'content', 'text_content', 'raw_data']

    try:
        async with driver.session() as session:
            result = await session.run(body.query)
            
            async for record in result:
                for val in record.values():
                    
                    def add_node(n):
                        if not isinstance(n, Node): return
                        n_id = str(n.element_id)
                        if n_id not in nodes_map:
                            props = dict(n)
                            for p in HEAVY_PROPS:
                                if p in props: props[p] = "[Metadata available on probe]"
                            nodes_map[n_id] = {"id": n_id, "labels": list(n.labels), "properties": props}
                    
                    def add_rel(r):
                        if not isinstance(r, Relationship): return
                        r_id = str(r.element_id)
                        # Avoid duplicates
                        if any(re["id"] == r_id for re in rels_list): return
                        
                        s_id = str(r.start_node.element_id)
                        t_id = str(r.end_node.element_id)
                        
                        rels_list.append({
                            "id": r_id, "type": r.type,
                            "from": s_id, "to": t_id,
                            "properties": {k: v for k, v in dict(r).items() if k not in HEAVY_PROPS}
                        })
                        # Ensure nodes are added
                        add_node(r.start_node)
                        add_node(r.end_node)

                    if isinstance(val, Node):
                        add_node(val)
                    elif isinstance(val, Relationship):
                        add_rel(val)
                    elif isinstance(val, Path):
                        for n in val.nodes: add_node(n)
                        for r in val.relationships: add_rel(r)
                    elif isinstance(val, list):
                        for item in val:
                            if isinstance(item, Node): add_node(item)
                            elif isinstance(item, Relationship): add_rel(item)
        
        return GraphResponse(nodes=list(nodes_map.values()), relationships=rels_list)
    except Exception as e:
        print(f"Cypher execution error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/graph", response_model=GraphResponse)
async def get_graph(
    request: Request,
    limit: int = 1500, 
    mode: str = Query("contextual", alias="mode"),
    q: Optional[str] = Query(None)
):
    driver = request.app.state.driver
    nodes_map = {}
    rels_list = []
    
    # Pruned properties list
    HEAVY_PROPS = ['body', 'content', 'text_content', 'raw_data']
    # Performance Tuning: Global reduced to 800 for canvas speed, contextual to 300
    fetch_limit = 800 if mode == "global" else min(limit, 300)
    
    try:
        async with driver.session() as session:
            if mode == "global":
                query = """
                MATCH (s)-[r]->(t)
                WHERE NOT type(r) = 'PART_OF'
                RETURN s, r, t 
                LIMIT $limit
                """
                params = {"limit": fetch_limit}
            elif q:
                # CONTEXTUAL SUBGRAPH MODE (Enhanced search across name, email, subject)
                keywords = filter_keywords(q)
                query = """
                UNWIND $keywords AS kw
                MATCH (n)
                WHERE (
                    (n:Entity OR n:Employee) AND toLower(n.name) CONTAINS toLower(kw)
                ) OR (
                    n:Employee AND toLower(n.email) CONTAINS toLower(kw)
                ) OR (
                    n:Email AND toLower(n.subject) CONTAINS toLower(kw)
                )
                MATCH (n)-[r]-(m)
                WHERE (m:Entity OR m:Employee OR m:Email)
                AND NOT type(r) = 'PART_OF'
                RETURN n AS s, r, m AS t
                LIMIT $limit
                """
                params = {"keywords": keywords, "limit": fetch_limit}
            else:
                # TOP FREQUENCY MODE (Default)
                query = """
                MATCH (s)-[r]->(t)
                WHERE (s:Employee OR s:Entity) AND (t:Employee OR t:Entity OR t:Email)
                AND NOT type(r) = 'PART_OF' 
                RETURN s, r, t 
                ORDER BY coalesce(r.frequency, 0) DESC
                LIMIT $limit
                """
                params = {"limit": fetch_limit}

            res = await session.run(query, **params)
            
            async for record in res:
                s, r, t = record["s"], record["r"], record["t"]
                s_id, t_id = str(s.element_id), str(t.element_id)
                
                def enrich_node(n):
                    props = dict(n)
                    labels = list(n.labels)
                    for prop in HEAVY_PROPS:
                        if prop in props:
                            props[prop] = "[Metadata available on probe]"
                    return {"id": str(n.element_id), "labels": labels, "properties": props}

                if s_id not in nodes_map: nodes_map[s_id] = enrich_node(s)
                if t_id not in nodes_map: nodes_map[t_id] = enrich_node(t)
                
                rels_list.append({
                    "id": str(r.element_id), "type": r.type,
                    "from": s_id, "to": t_id, "properties": {k: v for k, v in dict(r).items() if k not in HEAVY_PROPS}
                })
        
        return GraphResponse(nodes=list(nodes_map.values()), relationships=rels_list)
    except Exception as e:
        print(f"Graph fetch error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/node/{element_id}/neighbors", response_model=GraphResponse)
async def get_neighbors(request: Request, element_id: str, limit: int = 50):
    driver = request.app.state.driver
    nodes_map = {}
    rels_list = []
    
    try:
        async with driver.session() as session:
            query = """
                MATCH (n)-[r]-(m)
                WHERE elementId(n) = $id
                RETURN n, r, m LIMIT $limit
            """
            res = await session.run(query, id=element_id, limit=limit)
            
            async for record in res:
                n, r, m = record["n"], record["r"], record["m"]
                n_id, m_id = str(n.element_id), str(m.element_id)
                
                if n_id not in nodes_map:
                    nodes_map[n_id] = {"id": n_id, "labels": list(n.labels), "properties": dict(n)}
                if m_id not in nodes_map:
                    nodes_map[m_id] = {"id": m_id, "labels": list(m.labels), "properties": dict(m)}
                
                r_start, r_end = str(r.start_node.element_id), str(r.end_node.element_id)
                rels_list.append({
                    "id": str(r.element_id), "type": r.type,
                    "from": r_start, "to": r_end, "properties": dict(r)
                })
        
        return GraphResponse(nodes=list(nodes_map.values()), relationships=rels_list)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/search/suggest", response_model=SuggestionResponse)
async def get_suggestions(request: Request, q: str = Query(..., min_length=2)):
    driver = request.app.state.driver
    try:
        async with driver.session() as session:
            query = """
                MATCH (n)
                WHERE ((n:Employee OR n:Entity) AND (toLower(n.name) CONTAINS toLower($q)))
                   OR (n:Employee AND toLower(n.email) CONTAINS toLower($q))
                RETURN coalesce(n.name, n.email) AS name, labels(n) AS labels, elementId(n) AS id
                LIMIT 10
            """
            res = await session.run(query, q=q)
            suggestions = []
            async for record in res:
                suggestions.append({
                    "name": record["name"], 
                    "label": record["labels"][0], 
                    "id": record["id"]
                })
            return SuggestionResponse(suggestions=suggestions)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
