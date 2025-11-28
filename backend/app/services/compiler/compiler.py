from typing import Dict, Any, List, Set
from collections import defaultdict


class WorkflowCompiler:
    """
    Compiles ReactFlow graph to LangGraph workflow.

    For MVP, we generate Python code that can be executed.
    In production, this could compile to an actual LangGraph StateGraph object.
    """

    def __init__(self):
        self.nodes: List[Dict[str, Any]] = []
        self.edges: List[Dict[str, Any]] = []
        self.node_map: Dict[str, Dict[str, Any]] = {}
        self.adjacency: Dict[str, List[str]] = defaultdict(list)

    def compile(self, graph_data: Dict[str, Any]) -> str:
        """
        Compile ReactFlow graph to LangGraph code.

        Args:
            graph_data: Dictionary with 'nodes' and 'edges' keys

        Returns:
            Generated Python code as string
        """
        self.nodes = graph_data.get("nodes", [])
        self.edges = graph_data.get("edges", [])

        # Build node map and adjacency list
        for node in self.nodes:
            self.node_map[node["id"]] = node

        for edge in self.edges:
            self.adjacency[edge["source"]].append(edge["target"])

        # Validate workflow
        self._validate()

        # Generate code
        code = self._generate_code()

        return code

    def _validate(self):
        """Validate the workflow structure"""
        # Check for at least one trigger node
        trigger_nodes = [n for n in self.nodes if n["type"] == "trigger"]
        if not trigger_nodes:
            raise ValueError("Workflow must have at least one trigger node")

        # Check for cycles (simple check - can be improved)
        # For MVP, we'll allow cycles as they might be intentional in agents

        # Check that all edges reference existing nodes
        node_ids = {n["id"] for n in self.nodes}
        for edge in self.edges:
            if edge["source"] not in node_ids:
                raise ValueError(f"Edge source '{edge['source']}' not found")
            if edge["target"] not in node_ids:
                raise ValueError(f"Edge target '{edge['target']}' not found")

    def _generate_code(self) -> str:
        """Generate Python/LangGraph code"""
        # For MVP, we'll generate a simple representation
        # In production, this would generate actual executable LangGraph code

        code_lines = [
            "# Generated LangGraph Workflow",
            "from langgraph.graph import StateGraph, END",
            "from typing import TypedDict, Annotated",
            "import operator",
            "",
            "# State definition",
            "class WorkflowState(TypedDict):",
            "    messages: Annotated[list, operator.add]",
            "    current_node: str",
            "    data: dict",
            "",
        ]

        # Generate node functions
        for node in self.nodes:
            node_code = self._generate_node_function(node)
            code_lines.extend(node_code)
            code_lines.append("")

        # Generate graph construction
        code_lines.extend([
            "# Build graph",
            "workflow = StateGraph(WorkflowState)",
            "",
        ])

        # Add nodes
        for node in self.nodes:
            code_lines.append(f'workflow.add_node("{node["id"]}", {node["id"]}_handler)')

        code_lines.append("")

        # Add edges
        for edge in self.edges:
            source = edge["source"]
            target = edge["target"]
            code_lines.append(f'workflow.add_edge("{source}", "{target}")')

        # Set entry point (first trigger node)
        trigger_nodes = [n for n in self.nodes if n["type"] == "trigger"]
        if trigger_nodes:
            entry_node = trigger_nodes[0]["id"]
            code_lines.append(f'workflow.set_entry_point("{entry_node}")')

        code_lines.extend([
            "",
            "# Compile graph",
            "app = workflow.compile()",
        ])

        return "\n".join(code_lines)

    def _generate_node_function(self, node: Dict[str, Any]) -> List[str]:
        """Generate function code for a specific node"""
        node_id = node["id"]
        node_type = node["type"]
        node_data = node.get("data", {})

        lines = [
            f"def {node_id}_handler(state: WorkflowState):",
            f'    """Handler for {node_type} node: {node_id}"""',
        ]

        # Generate node-type specific code
        if node_type == "trigger":
            lines.extend([
                "    # Trigger node - initializes workflow",
                "    state['current_node'] = '" + node_id + "'",
                "    return state",
            ])

        elif node_type == "llm":
            model = node_data.get("model", "gpt-4")
            prompt = node_data.get("prompt", "")
            lines.extend([
                f"    # LLM node - model: {model}",
                "    # TODO: Implement LLM call",
                f"    # prompt = '''{prompt}'''",
                "    state['current_node'] = '" + node_id + "'",
                "    # state['data']['llm_output'] = call_llm(prompt, state)",
                "    return state",
            ])

        elif node_type == "api":
            url = node_data.get("url", "")
            method = node_data.get("method", "GET")
            lines.extend([
                f"    # API node - {method} {url}",
                "    # TODO: Implement API call",
                "    state['current_node'] = '" + node_id + "'",
                "    # state['data']['api_response'] = call_api(...)",
                "    return state",
            ])

        elif node_type == "conditional":
            condition = node_data.get("condition", "")
            lines.extend([
                f"    # Conditional node",
                f"    # condition: {condition}",
                "    state['current_node'] = '" + node_id + "'",
                "    # Evaluate condition and route accordingly",
                "    return state",
            ])

        elif node_type == "output":
            lines.extend([
                "    # Output node - final result",
                "    state['current_node'] = '" + node_id + "'",
                "    return state",
            ])

        else:
            lines.extend([
                f"    # Unknown node type: {node_type}",
                "    state['current_node'] = '" + node_id + "'",
                "    return state",
            ])

        return lines
