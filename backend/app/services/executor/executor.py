from typing import Dict, Any, List
from datetime import datetime
from uuid import UUID
from sqlalchemy.orm import Session
import asyncio
import httpx

from app.models.execution import Execution, ExecutionStatus, ExecutionLog, LogLevel
from app.services.executor.node_handlers import NodeHandlerFactory


class WorkflowExecutor:
    """
    Executes workflows by processing nodes in topological order.

    For MVP, we execute nodes sequentially following edges.
    In production, this would use LangGraph's execution engine.
    """

    def __init__(self, db: Session):
        self.db = db
        self.handler_factory = NodeHandlerFactory(db)

    async def execute(self, execution_id: UUID, graph_data: Dict[str, Any]):
        """
        Execute a workflow.

        Args:
            execution_id: The execution record ID
            graph_data: The workflow graph definition
        """
        execution = self.db.query(Execution).filter(
            Execution.id == execution_id
        ).first()

        if not execution:
            raise ValueError(f"Execution {execution_id} not found")

        try:
            # Update status to running
            execution.status = ExecutionStatus.RUNNING
            execution.started_at = datetime.utcnow()
            self.db.commit()

            # Log start
            self._add_log(
                execution_id,
                None,
                LogLevel.INFO,
                "Workflow execution started",
                {"input": execution.input_data}
            )

            # Parse graph
            nodes = {node["id"]: node for node in graph_data.get("nodes", [])}
            edges = graph_data.get("edges", [])

            # Build adjacency list
            adjacency = {}
            for node_id in nodes:
                adjacency[node_id] = []

            for edge in edges:
                adjacency[edge["source"]].append(edge["target"])

            # Find entry point (first trigger node)
            trigger_nodes = [
                node for node in nodes.values()
                if node["type"] == "trigger"
            ]

            if not trigger_nodes:
                raise ValueError("No trigger node found")

            entry_node_id = trigger_nodes[0]["id"]

            # Initialize workflow state
            state = {
                "data": execution.input_data or {},
                "current_node": None,
                "messages": [],
            }

            # Execute workflow starting from entry point
            await self._execute_from_node(
                execution_id,
                entry_node_id,
                nodes,
                adjacency,
                state,
                visited=set()
            )

            # Mark as completed
            execution.status = ExecutionStatus.COMPLETED
            execution.completed_at = datetime.utcnow()
            execution.output_data = state.get("data", {})
            self.db.commit()

            self._add_log(
                execution_id,
                None,
                LogLevel.INFO,
                "Workflow execution completed",
                {"output": execution.output_data}
            )

        except Exception as e:
            # Mark as failed
            execution.status = ExecutionStatus.FAILED
            execution.completed_at = datetime.utcnow()
            execution.error_message = str(e)
            self.db.commit()

            self._add_log(
                execution_id,
                None,
                LogLevel.ERROR,
                f"Workflow execution failed: {str(e)}",
                {"error": str(e)}
            )

            raise

    async def _execute_from_node(
        self,
        execution_id: UUID,
        node_id: str,
        nodes: Dict[str, Any],
        adjacency: Dict[str, List[str]],
        state: Dict[str, Any],
        visited: set
    ):
        """
        Execute workflow starting from a specific node.

        This implements a simple depth-first execution.
        For production, use LangGraph's execution engine.
        """
        if node_id in visited:
            # Prevent infinite loops (basic cycle detection)
            return

        visited.add(node_id)

        node = nodes.get(node_id)
        if not node:
            raise ValueError(f"Node {node_id} not found")

        # Log node execution start
        self._add_log(
            execution_id,
            node_id,
            LogLevel.INFO,
            f"Executing node: {node['type']}",
            {"node_data": node.get("data", {})}
        )

        # Get handler for this node type
        handler = self.handler_factory.get_handler(node["type"])

        # Execute node
        try:
            state = await handler.execute(node, state)

            # Log node execution success
            self._add_log(
                execution_id,
                node_id,
                LogLevel.INFO,
                f"Node completed: {node['type']}",
                {"state": state.get("data", {})}
            )

        except Exception as e:
            self._add_log(
                execution_id,
                node_id,
                LogLevel.ERROR,
                f"Node failed: {str(e)}",
                {"error": str(e)}
            )
            raise

        # Execute next nodes
        next_nodes = adjacency.get(node_id, [])
        for next_node_id in next_nodes:
            await self._execute_from_node(
                execution_id,
                next_node_id,
                nodes,
                adjacency,
                state,
                visited
            )

    def _add_log(
        self,
        execution_id: UUID,
        node_id: str,
        level: LogLevel,
        message: str,
        data: Dict[str, Any] = None
    ):
        """Add a log entry to the execution"""
        log = ExecutionLog(
            execution_id=execution_id,
            node_id=node_id,
            level=level,
            message=message,
            data=data
        )
        self.db.add(log)
        self.db.commit()
