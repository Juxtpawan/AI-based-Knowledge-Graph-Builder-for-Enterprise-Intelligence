"""
api/routers/node_analytics.py — Real-time behavioral pulse for individual nodes.
"""
from fastapi import APIRouter, HTTPException, Request
import random
from typing import List

from models.analytics import NodePulse, MetricItem
from database import get_driver

router = APIRouter(tags=["Node Analytics"])

@router.get("/node/{node_id}/pulse", response_model=NodePulse)
async def get_node_pulse(request: Request, node_id: str):
    """
    Fetch real-time behavioral metrics for a specific node.
    Simulates a 'live' pulse using current graph state and random drift.
    """
    driver = get_driver(request)
    try:
        async with driver.session() as session:
            # 1. Fetch Basic Connectivity (Degree)
            res = await session.run(
                "MATCH (n)-[r]-() WHERE elementId(n) = $id RETURN count(r) as degree, n.name as name, labels(n)[0] as lbl",
                id=node_id
            )
            record = await res.single()
            if not record:
                raise HTTPException(status_code=404, detail="Node not found")
            
            degree = record["degree"]
            name = record["name"] or record["lbl"]

            # 2. Fetch Top Interactors
            inter_res = await session.run(
                "MATCH (n)-[r]-(m) WHERE elementId(n) = $id RETURN m.name as name, count(r) as weight ORDER BY weight DESC LIMIT 3",
                id=node_id
            )
            top_interactors = []
            async for r in inter_res:
                top_interactors.append(MetricItem(name=r["name"] or "Unknown", value=r["weight"]))

            # 3. Calculate Risk Coefficient (0-100%)
            # High risk if flagged or has many relationships in a small network
            is_flagged = await session.run("MATCH (n) WHERE elementId(n) = $id AND n.curation_status = 'flagged' RETURN count(n) > 0 as f", id=node_id)
            flagged_rec = await is_flagged.single()
            risk_base = 65.0 if flagged_rec["f"] else 15.0
            risk = min(100.0, risk_base + (degree * 0.5))

            # 4. Generate Simulation Data (Pulse Sparkline)
            # In a real live system, this would be a time-series query. 
            # Here we simulate 'drift' to show the UI moving.
            burst_series = [random.randint(5, 15) for _ in range(10)]
            
            return NodePulse(
                interaction_velocity=round(1.2 + (degree * 0.05) + random.uniform(-0.2, 0.2), 2),
                influence_momentum=round(10.0 + (degree * 0.1) + random.uniform(-5.0, 5.0), 1),
                burst_pattern=round(0.4 + (degree * 0.01) + random.uniform(-0.1, 0.1), 2),
                risk_coefficient=round(risk, 1),
                top_interactors=top_interactors,
                burst_series=burst_series
            )
    except HTTPException:
        raise
    except Exception as e:
        print(f"[NodePulse] Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to calculate node pulse.")
