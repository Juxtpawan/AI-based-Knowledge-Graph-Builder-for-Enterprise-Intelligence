"""
api/routers/analytics.py — Dashboard analytics endpoints.

Routes:
  GET /analytics          → full analytics payload (KPIs + chart data)
  GET /analytics/pulse    → lightweight fast-poll (4 KPIs only, every 30s)
  GET /metrics            → legacy metrics endpoint (backward compat)
"""
import os
import json
from datetime import datetime
from fastapi import APIRouter, HTTPException, Request

from models.analytics import (
    AnalyticsResponse, PulseResponse, MetricsResponse,
    FluxDataPoint, MetricItem, DataInfo,
)
from services.analytics_engine import (
    format_uptime,
    compute_graph_density,
    compute_forensic_velocity,
    compute_anomaly_score,
)
from database import get_driver
from config import DATA_FILE_PATH, CHECKPOINT_FILE, TOTAL_EMAIL_RECORDS
from api.socket_manager import manager

router = APIRouter(tags=["Analytics"])


async def _fetch_counts(session):
    """Fetch total node and relationship counts from Neo4j."""
    res = await session.run("""
        MATCH (n) WITH count(n) AS nodeCount
        MATCH ()-[r]->() WITH nodeCount, count(r) AS relCount
        RETURN nodeCount, relCount
    """)
    record = await res.single()
    return (
        record["nodeCount"] if record else 0,
        record["relCount"] if record else 0,
    )


async def _fetch_flagged(session):
    """Fetch counts of flagged nodes and relationships."""
    res = await session.run("""
        MATCH (n) WHERE n.curation_status IN ['flagged', 'severe']
        WITH count(n) AS flaggedNodes
        MATCH ()-[r]->() WHERE r.curation_status IN ['flagged', 'severe']
        RETURN flaggedNodes, count(r) AS flaggedRels
    """)
    record = await res.single()
    return (
        record["flaggedNodes"] if record else 0,
        record["flaggedRels"] if record else 0,
    )


async def _fetch_cognitive_flux(session) -> list:
    """
    Build the Cognitive Flux chart series by bucketing Enron emails
    by day-of-week.

    Strategy A: use the pre-computed `weekday` integer on Email nodes (0=Mon).
    Strategy B: fallback — parse ISO date string "YYYY-MM-DD ...".
    """
    DOW_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    flux_map = {i: {"volume": 0, "risk": 0} for i in range(7)}

    # Strategy A
    res = await session.run("""
        MATCH (e:Email)
        WHERE e.weekday IS NOT NULL
        RETURN
            e.weekday AS dow,
            count(e) AS total,
            count(CASE WHEN e.curation_status = 'flagged' THEN 1 END) AS flagged
    """)
    has_weekday = False
    async for rec in res:
        dow = rec["dow"]
        if dow is not None and 0 <= dow <= 6:
            flux_map[dow]["volume"] = rec["total"]
            flux_map[dow]["risk"] = rec["flagged"]
            has_weekday = True

    # Strategy B (fallback)
    if not has_weekday:
        res2 = await session.run("""
            MATCH (e:Email)
            WHERE e.date IS NOT NULL
            RETURN e.date AS date, e.curation_status AS flag
            LIMIT 10000
        """)
        async for rec in res2:
            raw = rec["date"]
            if not raw:
                continue
            try:
                parsed = datetime.strptime(raw[:10], "%Y-%m-%d")
                dow = parsed.weekday()
                flux_map[dow]["volume"] += 1
                if rec["flag"] == "flagged":
                    flux_map[dow]["risk"] += 1
            except (ValueError, TypeError):
                continue

    return [
        FluxDataPoint(name=DOW_NAMES[i], volume=flux_map[i]["volume"], risk=flux_map[i]["risk"])
        for i in range(7)
    ]


@router.get("/analytics", response_model=AnalyticsResponse)
async def get_analytics(request: Request):
    """
    Full real-time analytics payload for the Overview dashboard.
    Fetches all KPIs, entity breakdown, top communicators,
    and the Cognitive Flux chart series from Neo4j.
    """
    driver = get_driver(request)
    start_time = request.app.state.start_time

    try:
        async with driver.session() as session:
            node_count, rel_count = await _fetch_counts(session)
            flagged_nodes, flagged_rels = await _fetch_flagged(session)
            total_flagged = flagged_nodes + flagged_rels
            total_elements = node_count + rel_count

            # Entity breakdown by label
            entity_res = await session.run("""
                MATCH (n)
                UNWIND labels(n) AS lbl
                WITH lbl, count(*) AS cnt
                ORDER BY cnt DESC LIMIT 10
                RETURN lbl AS name, cnt AS value
            """)
            entity_breakdown = []
            async for rec in entity_res:
                entity_breakdown.append(MetricItem(name=rec["name"], value=rec["value"]))

            # 3. Data Processing Pipeline Info
            processed_records, last_updated = 0, "Never"
            if os.path.exists(CHECKPOINT_FILE):
                try:
                    with open(CHECKPOINT_FILE, "r") as f:
                        cp = json.load(f)
                        processed_records = cp.get("last_processed_index", 0) + 1
                        last_updated = cp.get("timestamp", "Unknown")
                except: pass
            
            data_info = DataInfo(
                total_records=TOTAL_EMAIL_RECORDS,
                processed_records=processed_records,
                data_file="emails.csv",
                last_updated=last_updated,
                file_size_mb=round(os.path.getsize(DATA_FILE_PATH) / (1024*1024), 2) if os.path.exists(DATA_FILE_PATH) else 0.0
            )

            # Top communicators
            comm_res = await session.run("""
                MATCH (e:Employee)-[r:COMMUNICATES_WITH]->()
                WITH e.name AS name, count(r) AS freq
                ORDER BY freq DESC LIMIT 8
                RETURN name, freq AS value
            """)
            top_communicators = []
            async for rec in comm_res:
                top_communicators.append(MetricItem(
                    name=rec["name"] or "Unknown",
                    value=rec["value"],
                ))

            cognitive_flux_series = await _fetch_cognitive_flux(session)

        return AnalyticsResponse(
            intelligence_links=rel_count,
            forensic_velocity=compute_forensic_velocity(node_count, rel_count),
            anomaly_score=compute_anomaly_score(total_flagged, total_elements),
            neural_uptime=format_uptime(start_time),
            graph_density=compute_graph_density(node_count, rel_count),
            total_entities=node_count,
            flagged_nodes=flagged_nodes,
            flagged_rels=flagged_rels,
            entity_breakdown=entity_breakdown,
            top_communicators=top_communicators,
            cognitive_flux_series=cognitive_flux_series,
            data_info=data_info,
        )
    except Exception as e:
        print(f"[Analytics] Error: {e}")
        raise HTTPException(status_code=500, detail="Analytics calculation failed.")


async def fetch_real_time_snapshot(driver, start_time):
    """
    Utility for the background worker to fetch the latest dashboard state
    without an HTTP request context.
    """
    try:
        async with driver.session() as session:
            node_count, rel_count = await _fetch_counts(session)
            flagged_nodes, flagged_rels = await _fetch_flagged(session)
            total_flagged = flagged_nodes + flagged_rels
            total_elements = node_count + rel_count

            # Entity breakdown
            entity_res = await session.run("""
                MATCH (n) UNWIND labels(n) AS lbl
                WITH lbl, count(*) AS cnt
                ORDER BY cnt DESC LIMIT 10
                RETURN lbl AS name, cnt AS value
            """)
            entity_breakdown = []
            async for rec in entity_res:
                entity_breakdown.append({"name": rec["name"], "value": rec["value"]})

            # Top communicators
            comm_res = await session.run("""
                MATCH (e:Employee)-[r:COMMUNICATES_WITH]->()
                WITH e.name AS name, count(r) AS freq
                ORDER BY freq DESC LIMIT 8
                RETURN name, freq AS value
            """)
            top_communicators = []
            async for rec in comm_res:
                top_communicators.append({"name": rec["name"] or "Unknown", "value": rec["value"]})

            # Pipeline Info
            processed_records = 0
            if os.path.exists(CHECKPOINT_FILE):
                try:
                    with open(CHECKPOINT_FILE, "r") as f:
                        cp = json.load(f)
                        processed_records = cp.get("last_processed_index", 0) + 1
                except: pass

            # 5. Alerts (Curated Elements)
            node_res = await session.run("""
                MATCH (n) WHERE n.curation_status IN ['flagged', 'severe', 'verified']
                RETURN n.name AS name, labels(n)[0] AS lbl, n.curation_status AS st, 
                       n.curation_severity AS sev, n.curation_category AS cat, n.curation_note AS note,
                       elementId(n) AS id
                LIMIT 10
            """)
            rel_res = await session.run("""
                MATCH (s)-[r]->(t) WHERE r.curation_status IN ['flagged', 'severe', 'verified']
                RETURN type(r) AS type, s.name AS src, t.name AS tgt, r.curation_status AS st, 
                       r.curation_severity AS sev, r.curation_category AS cat, r.curation_note AS note,
                       elementId(r) AS id
                LIMIT 10
            """)
            
            alerts = []
            status_map = {'severe': 'critical', 'flagged': 'warning', 'verified': 'info'}
            
            async for rec in node_res:
                st = rec["st"]
                alerts.append({
                    "element_id": rec["id"],
                    "is_node": True,
                    "type": status_map.get(st, 'info'),
                    "title": f"{st.capitalize()}: {rec['name'] or rec['lbl']}",
                    "description": rec["note"] or rec["cat"] or "Manual audit",
                    "time": "Live"
                })
            async for rec in rel_res:
                st = rec["st"]
                alerts.append({
                    "element_id": rec["id"],
                    "is_node": False,
                    "type": status_map.get(st, 'info'),
                    "title": f"{st.capitalize()}: {rec['src']} -> {rec['tgt']}",
                    "description": rec["note"] or rec["cat"] or "Manual audit",
                    "time": "Live"
                })

            return {
                "type": "analytics_update",
                "payload": {
                    "intelligence_links": rel_count,
                    "forensic_velocity": compute_forensic_velocity(node_count, rel_count),
                    "anomaly_score": compute_anomaly_score(total_flagged, total_elements),
                    "neural_uptime": format_uptime(start_time),
                    "total_entities": node_count,
                    "entity_breakdown": entity_breakdown,
                    "top_communicators": top_communicators,
                    "alerts": alerts,
                    "processing_info": {
                        "total": TOTAL_EMAIL_RECORDS,
                        "processed": processed_records,
                        "percentage": round((processed_records / TOTAL_EMAIL_RECORDS) * 100, 2) if TOTAL_EMAIL_RECORDS > 0 else 0
                    }
                }
            }
    except Exception as e:
        print(f"[Snapshot] Error: {e}")
        return None


@router.get("/analytics/pulse", response_model=PulseResponse)
async def get_pulse(request: Request):
    """
    Lightweight fast-poll endpoint for live KPI card updates.
    Returns only the 4 core KPIs — no chart data.
    Designed to be called every 30 seconds from the frontend.
    """
    driver = get_driver(request)
    start_time = request.app.state.start_time

    try:
        async with driver.session() as session:
            node_count, rel_count = await _fetch_counts(session)
            flagged_nodes, flagged_rels = await _fetch_flagged(session)

        total_flagged = flagged_nodes + flagged_rels
        total_elements = node_count + rel_count

        return PulseResponse(
            intelligence_links=rel_count,
            forensic_velocity=compute_forensic_velocity(node_count, rel_count),
            anomaly_score=compute_anomaly_score(total_flagged, total_elements),
            neural_uptime=format_uptime(start_time),
            graph_density=compute_graph_density(node_count, rel_count),
            flagged_nodes=flagged_nodes,
            flagged_rels=flagged_rels,
        )
    except Exception as e:
        print(f"[Pulse] Error: {e}")
        raise HTTPException(status_code=500, detail="Pulse check failed.")


@router.get("/metrics", response_model=MetricsResponse)
async def get_metrics(request: Request):
    """
    Legacy /metrics endpoint — kept for backward compatibility.
    Prefer /analytics for new features.
    """
    driver = get_driver(request)
    _empty_data = DataInfo(
        total_records=0, processed_records=0,
        data_file="", last_updated="", file_size_mb=0,
    )
    try:
        async with driver.session() as session:
            query = """
            MATCH (n)
            WITH count(n) AS total_entities
            MATCH ()-[r]->()
            WITH count(r) AS total_relationships, total_entities
            MATCH (n)
            UNWIND labels(n) AS label
            WITH label, count(*) AS label_count, total_entities, total_relationships
            WITH collect({name: label, value: label_count}) AS entity_types,
                 total_entities, total_relationships
            MATCH (e:Employee)-[r:COMMUNICATES_WITH]->()
            WITH e.name AS name, sum(r.frequency) AS total_freq,
                 entity_types, total_entities, total_relationships
            ORDER BY total_freq DESC LIMIT 8
            RETURN total_entities, total_relationships, entity_types,
                   collect({name: name, value: total_freq}) AS top_communicators
            """
            result = await session.run(query)
            record = await result.single()

        if not record:
            return MetricsResponse(
                total_entities=0, total_relationships=0,
                entity_types=[], top_communicators=[],
                data_info=_empty_data,
            )

        # File system info
        processed_records, last_updated = 0, "Never"
        if os.path.exists(CHECKPOINT_FILE):
            with open(CHECKPOINT_FILE, "r") as f:
                cp = json.load(f)
                processed_records = cp.get("last_processed_index", 0) + 1
                last_updated = cp.get("timestamp", "Unknown")

        file_size_mb = 0.0
        if os.path.exists(DATA_FILE_PATH):
            file_size_mb = round(os.path.getsize(DATA_FILE_PATH) / (1024 * 1024), 2)

        return MetricsResponse(
            total_entities=record["total_entities"],
            total_relationships=record["total_relationships"],
            entity_types=[MetricItem(**item) for item in record["entity_types"]],
            top_communicators=[MetricItem(**item) for item in record["top_communicators"]],
            data_info=DataInfo(
                total_records=TOTAL_EMAIL_RECORDS,
                processed_records=processed_records,
                data_file="emails.csv",
                last_updated=last_updated,
                file_size_mb=file_size_mb,
            ),
        )
    except Exception as e:
        print(f"[Metrics] Error: {e}")
        return MetricsResponse(
            total_entities=0, total_relationships=0,
            entity_types=[], top_communicators=[],
            data_info=_empty_data,
        )
