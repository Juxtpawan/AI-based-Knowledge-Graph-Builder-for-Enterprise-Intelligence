"""
api/routers/graph.py — Graph discovery and exploration endpoints.

Routes:
  GET  /graph                    → fetch graph data (global / contextual / search)
  GET  /node/{element_id}/neighbors → expand a node's neighbourhood
  POST /cypher                   → run a raw Cypher query
  GET  /search/suggest           → autocomplete suggestions
  POST /query                    → hybrid RAG agent query
"""
from fastapi import APIRouter, HTTPException, Query, Request
from typing import Optional
from neo4j.graph import Node, Relationship, Path

from models.graph import (
    GraphResponse, CypherRequest, QueryRequest,
    QueryResponse, SuggestionResponse,
)
from database import get_driver
from config import GRAPH_LIMIT_GLOBAL, GRAPH_LIMIT_PROBE, HEAVY_PROPS
from miles3hybridRAG import generate_answer_async

router = APIRouter(tags=["Graph"])


def _enrich_node(n, heavy_props=HEAVY_PROPS) -> dict:
    """Build a serialisable node dict, stripping heavy text properties."""
    props = dict(n)
    for p in heavy_props:
        if p in props:
            props[p] = "[Metadata available on probe]"
    return {"id": str(n.element_id), "labels": list(n.labels), "properties": props}


def _enrich_rel(r, heavy_props=HEAVY_PROPS) -> dict:
    """Build a serialisable relationship dict."""
    return {
        "id": str(r.element_id),
        "type": r.type,
        "from": str(r.start_node.element_id),
        "to": str(r.end_node.element_id),
        "properties": {k: v for k, v in dict(r).items() if k not in heavy_props},
    }


@router.get("/graph", response_model=GraphResponse)
async def get_graph(
    request: Request,
    limit: int = 800,
    mode: str = Query("contextual", alias="mode"),
    q: Optional[str] = Query(None),
):
    """
    Fetch graph data from Neo4j.
    Modes:
      global      → broad edge sampling across the whole graph
      contextual  → default balanced sample
      (with q)    → search-filtered subgraph
    """
    driver = get_driver(request)
    nodes_map: dict = {}
    rels_list: list = []
    fetch_limit = GRAPH_LIMIT_GLOBAL if mode == "global" else min(limit, GRAPH_LIMIT_PROBE)

    try:
        async with driver.session() as session:
            if mode == "global":
                cypher = """
                MATCH (s)-[r]-(t)
                WHERE (s:Employee OR s:Entity OR s:Email)
                RETURN s, r, t LIMIT $limit
                """
                params = {"limit": fetch_limit}
            elif q:
                cypher = """
                MATCH (s)-[r]-(t)
                WHERE (
                    toLower(s.name)    CONTAINS toLower($q) OR
                    toLower(s.email)   CONTAINS toLower($q) OR
                    toLower(s.subject) CONTAINS toLower($q)
                )
                RETURN s, r, t LIMIT $limit
                """
                params = {"q": q, "limit": fetch_limit}
            else:
                cypher = "MATCH (s)-[r]-(t) RETURN s, r, t LIMIT $limit"
                params = {"limit": fetch_limit}

            print(f"[Graph] Mode={mode}  q={q}  limit={fetch_limit}")
            res = await session.run(cypher, params)

            async for record in res:
                s, r, t = record["s"], record["r"], record["t"]
                s_id = str(s.element_id)
                if s_id not in nodes_map:
                    nodes_map[s_id] = _enrich_node(s)

                if r is not None and t is not None:
                    t_id = str(t.element_id)
                    if t_id not in nodes_map:
                        nodes_map[t_id] = _enrich_node(t)
                    rels_list.append(_enrich_rel(r))

        return GraphResponse(nodes=list(nodes_map.values()), relationships=rels_list)
    except Exception as e:
        print(f"[Graph] Error: {e}")
        raise HTTPException(status_code=500, detail="Internal Graph Discovery Failure.")


@router.get("/node/{element_id}/neighbors", response_model=GraphResponse)
async def get_neighbors(request: Request, element_id: str, limit: int = 300):
    """Expand a single node and return its immediate neighbourhood."""
    driver = get_driver(request)
    nodes_map: dict = {}
    rels_list: list = []

    try:
        async with driver.session() as session:
            res = await session.run("""
                MATCH (n)-[r]-(m)
                WHERE elementId(n) = $id
                RETURN n, r, m LIMIT $limit
            """, id=element_id, limit=limit)

            async for record in res:
                n, r, m = record["n"], record["r"], record["m"]
                n_id, m_id = str(n.element_id), str(m.element_id)
                if n_id not in nodes_map:
                    nodes_map[n_id] = _enrich_node(n)
                if m_id not in nodes_map:
                    nodes_map[m_id] = _enrich_node(m)
                rels_list.append(_enrich_rel(r))

        return GraphResponse(nodes=list(nodes_map.values()), relationships=rels_list)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/node/{element_id}", response_model=dict)
async def get_node_details(request: Request, element_id: str):
    """Fetch the absolute FULL fidelity properties of a node OR relationship."""
    driver = get_driver(request)
    try:
        async with driver.session() as session:
            # 1. Try to fetch as a Node with potential Email enrichment
            res = await session.run(
                "MATCH (n) WHERE elementId(n) = $id RETURN n, labels(n) as lbls",
                id=element_id
            )
            record = await res.single()
            
            if record:
                n = record["n"]
                lbls = record["lbls"]
                props = dict(n)
                
                # SPECIAL ENRICHMENT: Email Nodes (Source/Recipients from Relationships)
                if "Email" in lbls:
                    # Find Sender
                    sender_res = await session.run(
                        "MATCH (s:Employee)-[:SENT]->(e) WHERE elementId(e) = $id "
                        "RETURN s.email as email, s.name as name LIMIT 1",
                        id=element_id
                    )
                    sender = await sender_res.single()
                    if sender:
                        props["from_email"] = sender["email"]
                        props["sender_name"] = sender["name"]
                    
                    # Find Recipients
                    rec_res = await session.run(
                        "MATCH (e)-[:TO]->(r:Employee) WHERE elementId(e) = $id "
                        "RETURN r.email as email, r.name as name",
                        id=element_id
                    )
                    recipients = []
                    async for r in rec_res:
                        recipients.append(r["email"] or r["name"])
                    if recipients:
                        props["to_emails"] = ", ".join(recipients)

                return {
                    "id": str(n.element_id),
                    "labels": lbls,
                    "properties": props,
                    "isRelationship": False
                }

            # 2. Try to fetch as a Relationship
            rel_res = await session.run(
                "MATCH (s)-[r]->(t) WHERE elementId(r) = $id "
                "RETURN r, type(r) as type, elementId(s) as from_id, elementId(t) as to_id, s.name as from_name, t.name as to_name",
                id=element_id
            )
            rel_record = await rel_res.single()
            if rel_record:
                r = rel_record["r"]
                return {
                    "id": str(r.element_id),
                    "type": rel_record["type"],
                    "properties": dict(r),
                    "from": rel_record["from_id"],
                    "to": rel_record["to_id"],
                    "from_name": rel_record["from_name"],
                    "to_name": rel_record["to_name"],
                    "isRelationship": True
                }

            raise HTTPException(status_code=404, detail="Element not found.")
    except HTTPException:
        raise
    except Exception as e:
        print(f"[NodeDetail] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cypher", response_model=GraphResponse)
async def run_cypher(request: Request, body: CypherRequest):
    """Execute an arbitrary Cypher query and return the result as a graph."""
    driver = get_driver(request)
    nodes_map: dict = {}
    rels_list: list = []

    def _add_node(n):
        if not isinstance(n, Node):
            return
        n_id = str(n.element_id)
        if n_id not in nodes_map:
            nodes_map[n_id] = _enrich_node(n)

    def _add_rel(r):
        if not isinstance(r, Relationship):
            return
        r_id = str(r.element_id)
        if any(e["id"] == r_id for e in rels_list):
            return
        rels_list.append(_enrich_rel(r))
        _add_node(r.start_node)
        _add_node(r.end_node)

    try:
        async with driver.session() as session:
            result = await session.run(body.query)
            async for record in result:
                for val in record.values():
                    if isinstance(val, Node):
                        _add_node(val)
                    elif isinstance(val, Relationship):
                        _add_rel(val)
                    elif isinstance(val, Path):
                        for n in val.nodes:
                            _add_node(n)
                        for r in val.relationships:
                            _add_rel(r)
                    elif isinstance(val, list):
                        for item in val:
                            if isinstance(item, Node):
                                _add_node(item)
                            elif isinstance(item, Relationship):
                                _add_rel(item)

        return GraphResponse(nodes=list(nodes_map.values()), relationships=rels_list)
    except Exception as e:
        print(f"[Cypher] Error: {e}")
        raise HTTPException(status_code=500, detail="Cypher execution failed.")


@router.get("/search/suggest", response_model=SuggestionResponse)
async def get_suggestions(request: Request, q: str = Query(..., min_length=2)):
    """Return autocomplete suggestions for nodes matching a search string."""
    driver = get_driver(request)
    try:
        async with driver.session() as session:
            res = await session.run("""
                MATCH (n)
                WHERE ((n:Employee OR n:Entity) AND (toLower(n.name) CONTAINS toLower($q)))
                   OR (n:Employee AND toLower(n.email) CONTAINS toLower($q))
                RETURN coalesce(n.name, n.email) AS name,
                       labels(n)                  AS labels,
                       elementId(n)               AS id
                LIMIT 10
            """, q=q)
            suggestions = []
            async for record in res:
                suggestions.append({
                    "name": record["name"],
                    "label": record["labels"][0],
                    "id": record["id"],
                })
        return SuggestionResponse(suggestions=suggestions)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/query", response_model=QueryResponse)
async def query_rag(request: Request, body: QueryRequest):
    """Run a question through the hybrid RAG agent and return the answer."""
    driver = get_driver(request)
    try:
        result = await generate_answer_async(body.query, driver=driver)
        return QueryResponse(
            answer=result["answer"],
            graph=GraphResponse(**result["graph"]) if result.get("graph") else None,
        )
    except Exception as e:
        print(f"[RAG] Error: {e}")
        raise HTTPException(status_code=500, detail="Intelligence synthesis failed.")
