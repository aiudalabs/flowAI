from pydantic import BaseModel
from typing import Dict, Any, List, Optional


class NodeConfig(BaseModel):
    """Configuration for a workflow node (ReactFlow format)"""
    id: str
    type: str
    position: Dict[str, float]  # {x: float, y: float}
    data: Dict[str, Any]  # Node-specific configuration


class ConditionalRoute(BaseModel):
    """Single route in a conditional edge"""
    label: str  # Display label (e.g., "If Positive")
    expression: str  # Python expression to evaluate (e.g., "state['sentiment'] == 'positive'")
    output: str  # Output key for routing function
    target: str  # Target node ID


class Edge(BaseModel):
    """Connection between nodes (ReactFlow format)"""
    id: str
    source: str
    target: str
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None
    type: Optional[str] = None  # 'default' | 'conditional' | 'smoothstep'

    # Conditional routing data
    data: Optional[Dict[str, Any]] = None  # For storing conditional config
    label: Optional[str] = None  # Edge label to display


class StateField(BaseModel):
    """State schema field definition for LangGraph"""
    name: str
    type: str  # 'str' | 'int' | 'float' | 'bool' | 'list' | 'dict' | 'Any'
    reducer: Optional[str] = 'none'  # 'none' | 'add' | 'add_messages' | 'custom'
    customReducer: Optional[str] = None
    defaultValue: Optional[str] = None
    description: Optional[str] = None


class GraphData(BaseModel):
    """Complete workflow graph definition"""
    nodes: List[NodeConfig]
    edges: List[Edge]
    state_schema: Optional[List[StateField]] = None
    viewport: Optional[Dict[str, Any]] = None
