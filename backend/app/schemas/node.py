from pydantic import BaseModel
from typing import Dict, Any, List, Optional


class NodeConfig(BaseModel):
    """Configuration for a workflow node (ReactFlow format)"""
    id: str
    type: str
    position: Dict[str, float]  # {x: float, y: float}
    data: Dict[str, Any]  # Node-specific configuration


class Edge(BaseModel):
    """Connection between nodes (ReactFlow format)"""
    id: str
    source: str
    target: str
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None
    type: Optional[str] = None


class GraphData(BaseModel):
    """Complete workflow graph definition"""
    nodes: List[NodeConfig]
    edges: List[Edge]
    viewport: Optional[Dict[str, Any]] = None
