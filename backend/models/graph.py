"""
models/graph.py — Pydantic models for graph data structures.
Used by the /graph, /cypher, /node, /search, and /query endpoints.
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any


class GraphNode(BaseModel):
    id: str
    labels: List[str]
    properties: Dict[str, Any]


class GraphRelationship(BaseModel):
    id: str
    type: str
    from_node: str = Field(alias="from")
    to_node: str = Field(alias="to")
    properties: Dict[str, Any]
    model_config = ConfigDict(populate_by_name=True)


class GraphResponse(BaseModel):
    nodes: List[Dict[str, Any]]
    relationships: List[Dict[str, Any]]


class QueryRequest(BaseModel):
    query: str


class QueryResponse(BaseModel):
    answer: str
    graph: Optional[GraphResponse] = None


class CypherRequest(BaseModel):
    query: str


class SuggestionResponse(BaseModel):
    suggestions: List[Dict[str, Any]]
