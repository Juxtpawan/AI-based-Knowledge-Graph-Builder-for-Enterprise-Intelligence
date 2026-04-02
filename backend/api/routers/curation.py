"""
api/routers/curation.py — Human-in-the-Loop (HITL) curation endpoints.

Routes:
  POST  /curate              → flag, verify, or neutralise a graph element
  GET   /alerts              → list all currently flagged elements as alerts
  DELETE /elements/{id}      → permanently prune an element from the graph
"""
from fastapi import APIRouter, HTTPException, Query, Request
from typing import List

from models.curation import CurationRequest, AlertItem
from database import get_driver

router = APIRouter(tags=["Curation"])


@router.post("/curate")
async def curate_element(request: Request, body: CurationRequest):
    """Set the curation status, severity, category, and note on any graph element."""
    driver = get_driver(request)
    try:
        async with driver.session() as session:
            if body.is_node:
                query = """
                MATCH (n) WHERE elementId(n) = $id
                SET n.curation_status   = $status,
                    n.curation_severity = $severity,
                    n.curation_category = $category,
                    n.curation_note     = $note
                RETURN n
                """
            else:
                query = """
                MATCH ()-[r]->() WHERE elementId(r) = $id
                SET r.curation_status   = $status,
                    r.curation_severity = $severity,
                    r.curation_category = $category,
                    r.curation_note     = $note
                RETURN r
                """
            res = await session.run(
                query,
                id=body.element_id,
                status=body.status,
                severity=body.severity,
                category=body.category,
                note=body.note,
            )
            record = await res.single()
            if not record:
                raise HTTPException(status_code=404, detail="Element not found")
        return {"status": "success", "element_id": body.element_id}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Curation] Error: {e}")
        raise HTTPException(
            status_code=500,
            detail="State update failed. Database connection may be transient.",
        )


@router.get("/alerts", response_model=List[AlertItem])
async def get_alerts(request: Request):
    """Return all flagged nodes and relationships as formatted alert items."""
    driver = get_driver(request)
    alerts: List[AlertItem] = []
    try:
        async with driver.session() as session:
            # Flagged nodes
            node_res = await session.run("""
                MATCH (n) WHERE n.curation_status = 'flagged'
                RETURN
                    n.name AS name,
                    n.curation_severity  AS severity,
                    n.curation_category  AS category,
                    n.curation_note      AS note,
                    labels(n)            AS labels
            """)
            async for rec in node_res:
                alerts.append(AlertItem(
                    title=f"Node Anomaly: {rec['name'] or rec['labels'][0]}",
                    severity=rec["severity"] or "Low",
                    category=rec["category"] or "Unknown",
                    detail=rec["note"] or "",
                ))

            # Flagged relationships
            rel_res = await session.run("""
                MATCH (s)-[r]->(t) WHERE r.curation_status = 'flagged'
                RETURN
                    type(r)             AS type,
                    r.curation_severity AS severity,
                    r.curation_category AS category,
                    r.curation_note     AS note,
                    s.name              AS source,
                    t.name              AS target
            """)
            async for rec in rel_res:
                alerts.append(AlertItem(
                    title=f"Rel Anomaly: {rec['source']} → {rec['type']} → {rec['target']}",
                    severity=rec["severity"] or "Low",
                    category=rec["category"] or "Unknown",
                    detail=rec["note"] or "",
                ))
        return alerts
    except Exception as e:
        print(f"[Alerts] Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch intelligence alerts.")


@router.delete("/elements/{element_id}")
async def delete_element(
    request: Request,
    element_id: str,
    is_node: bool = Query(True),
):
    """Permanently prune a node (DETACH DELETE) or relationship from the graph."""
    driver = get_driver(request)
    try:
        async with driver.session() as session:
            if is_node:
                query = "MATCH (n) WHERE elementId(n) = $id DETACH DELETE n RETURN count(n) AS deleted_count"
            else:
                query = "MATCH ()-[r]->() WHERE elementId(r) = $id DELETE r RETURN count(r) AS deleted_count"

            res = await session.run(query, id=element_id)
            record = await res.single()
            if not record or record["deleted_count"] == 0:
                raise HTTPException(status_code=404, detail="Element not found")
        return {"status": "success", "message": "Element pruned from graph"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Prune] Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to prune graph element.")
