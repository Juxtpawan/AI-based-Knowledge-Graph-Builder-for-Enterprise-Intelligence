"""
models/curation.py — Pydantic models for the Human-in-the-Loop curation system.
Used by /curate, /alerts, and /elements endpoints.
"""
from pydantic import BaseModel


class CurationRequest(BaseModel):
    """Payload for flagging, verifying, or neutralising a graph element."""
    element_id: str
    is_node: bool
    status: str          # 'verified' | 'flagged' | 'neutral'
    severity: str = "Low"   # 'Critical' | 'High' | 'Medium' | 'Low'
    category: str = "None"
    note: str = ""


class AlertItem(BaseModel):
    """A single forensic alert surfaced from flagged graph elements."""
    title: str
    severity: str
    category: str
    detail: str
