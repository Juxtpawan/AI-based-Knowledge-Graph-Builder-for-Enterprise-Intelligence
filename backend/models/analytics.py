"""
models/analytics.py — Pydantic models for the analytics/dashboard endpoints.
Used by /analytics, /analytics/pulse, and /metrics.
"""
from pydantic import BaseModel
from typing import List


class MetricItem(BaseModel):
    """A simple name-value pair used for chart series and entity counts."""
    name: str
    value: int


class DataInfo(BaseModel):
    """Pipeline data-file metadata returned by the legacy /metrics endpoint."""
    total_records: int
    processed_records: int
    data_file: str
    last_updated: str
    file_size_mb: float


class MetricsResponse(BaseModel):
    """Legacy /metrics response. Kept for backward compatibility."""
    total_entities: int
    total_relationships: int
    entity_types: List[MetricItem]
    top_communicators: List[MetricItem]
    data_info: DataInfo


class FluxDataPoint(BaseModel):
    """A single bucket in the Cognitive Flux time-series chart."""
    name: str    # e.g. "Mon", "Tue"
    volume: int  # total email count for this bucket
    risk: int    # count of flagged emails for this bucket


class PulseResponse(BaseModel):
    """
    Lightweight fast-poll response (4 core KPIs only).
    Designed for the 30-second live-update polling cycle.
    """
    intelligence_links: int
    forensic_velocity: float    # 0.0 – 100.0  (%)
    anomaly_score: float        # 0.0 – 10.0
    neural_uptime: str          # e.g. "2h 31m"
    graph_density: float        # 0.0 – 1.0
    flagged_nodes: int
    flagged_rels: int


class AnalyticsResponse(BaseModel):
    """
    Full analytics payload for the Overview dashboard.
    Returned by GET /analytics on initial load.
    """
    # Core KPIs
    intelligence_links: int
    forensic_velocity: float
    anomaly_score: float
    neural_uptime: str
    graph_density: float
    # Graph structure breakdown
    total_entities: int
    flagged_nodes: int
    flagged_rels: int
    entity_breakdown: List[MetricItem]
    top_communicators: List[MetricItem]
    # Chart series
    cognitive_flux_series: List[FluxDataPoint]
    # Pipeline status
    data_info: DataInfo


class NodePulse(BaseModel):
    """
    Real-time behavioral pulse for a specific node.
    Calculated on-demand for the Sidebar 'Activity Pulse' tab.
    """
    interaction_velocity: float    # e.g. 1.24 (rel creation speed)
    influence_momentum: float     # e.g. +12.5 (%)
    burst_pattern: float          # e.g. 0.85 (temporal clustering score)
    risk_coefficient: float       # e.g. 64.2 (%)
    top_interactors: List[MetricItem]
    burst_series: List[int]       # 10-point sparkline data (recent activity)
