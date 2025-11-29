"""
LangGraph Dynamic Executor

Executes workflows by:
1. Compiling workflow to LangGraph Python code
2. Running code in E2B sandbox for security
3. Capturing results and updating execution records

This executor uses REAL LangGraph (not a simulation), ensuring
identical behavior between UI testing and production deployment.
"""

from typing import Dict, Any, Optional
from datetime import datetime
from uuid import UUID
from sqlalchemy.orm import Session
import json
import os

from e2b_code_interpreter import Sandbox

from app.models.execution import Execution, ExecutionStatus, ExecutionLog, LogLevel
from app.models.dataset import Dataset
from app.services.compiler.langgraph_compiler import LangGraphCompiler
from app.core.config import settings


class LangGraphDynamicExecutor:
    """
    Executes workflows using real LangGraph code in E2B sandboxes.

    This is the production executor - it runs the actual compiled
    LangGraph code, not a simplified simulation.
    """

    def __init__(self, db: Session):
        self.db = db
        self.compiler = LangGraphCompiler()

        # Verify E2B API key is configured
        if not settings.E2B_API_KEY:
            raise ValueError(
                "E2B_API_KEY not found in settings. Get your key at https://e2b.dev/dashboard"
            )

        # Set E2B_API_KEY in environment for E2B SDK to use
        os.environ["E2B_API_KEY"] = settings.E2B_API_KEY

    async def execute(self, execution_id: UUID, graph_data: Dict[str, Any]):
        """
        Execute a workflow using real LangGraph.

        Args:
            execution_id: The execution record ID
            graph_data: The workflow graph definition with nodes, edges, state_schema

        Returns:
            dict: The final state after workflow execution
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
                "🚀 Starting LangGraph execution",
                {"input": execution.input_data}
            )

            # Step 1: Compile workflow to Python code
            self._add_log(
                execution_id,
                None,
                LogLevel.INFO,
                "🔧 Compiling workflow to LangGraph code",
                {}
            )

            workflow_name = graph_data.get("name", "Dynamic Workflow")
            state_schema = graph_data.get("state_schema", [])
            nodes = graph_data.get("nodes", [])
            edges = graph_data.get("edges", [])

            python_code = self.compiler.compile({
                "name": workflow_name,
                "state_schema": state_schema,
                "nodes": nodes,
                "edges": edges
            })

            self._add_log(
                execution_id,
                None,
                LogLevel.INFO,
                "✅ Code compilation successful",
                {"lines_of_code": len(python_code.split("\n"))}
            )

            # Step 2: Prepare initial state
            initial_state = execution.input_data or {}

            self._add_log(
                execution_id,
                None,
                LogLevel.INFO,
                "📊 Initial state prepared",
                {"state": initial_state}
            )

            # Step 3: Execute in E2B sandbox
            self._add_log(
                execution_id,
                None,
                LogLevel.INFO,
                "🔒 Executing in secure E2B sandbox",
                {}
            )

            result = await self._execute_in_sandbox(
                execution_id,
                python_code,
                initial_state,
                graph_data
            )

            # Mark as completed
            execution.status = ExecutionStatus.COMPLETED
            execution.completed_at = datetime.utcnow()
            execution.output_data = result
            self.db.commit()

            self._add_log(
                execution_id,
                None,
                LogLevel.INFO,
                "✅ Workflow execution completed",
                {"output": result}
            )

            return result

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
                f"❌ Workflow execution failed: {str(e)}",
                {"error": str(e), "type": type(e).__name__}
            )

            raise

    async def _execute_in_sandbox(
        self,
        execution_id: UUID,
        python_code: str,
        initial_state: Dict[str, Any],
        graph_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Execute Python code in E2B sandbox.

        Args:
            execution_id: For logging
            python_code: The compiled LangGraph code
            initial_state: Initial workflow state

        Returns:
            dict: Final state after execution
        """
        # Create execution wrapper that:
        # 1. Runs the compiled code
        # 2. Invokes the workflow with initial_state
        # 3. Prints result as JSON for capture

        execution_wrapper = f"""
# ===================================================================
# AUTO-GENERATED WORKFLOW EXECUTION
# ===================================================================

{python_code}

# ===================================================================
# EXECUTION WRAPPER
# ===================================================================

if __name__ == "__main__":
    import json
    import sys

    # Initial state from FlowAI
    initial_state = {json.dumps(initial_state, indent=2)}

    print("=" * 60, file=sys.stderr)
    print("🚀 Starting workflow execution...", file=sys.stderr)
    print(f"📊 Initial state: {{initial_state}}", file=sys.stderr)
    print("=" * 60, file=sys.stderr)

    try:
        # Execute the workflow
        result = app.invoke(initial_state)

        print("=" * 60, file=sys.stderr)
        print("✅ Execution completed successfully!", file=sys.stderr)
        print("=" * 60, file=sys.stderr)

        # Output result as JSON to stdout (for parsing)
        print(json.dumps(result, default=str))

    except Exception as e:
        print("=" * 60, file=sys.stderr)
        print(f"❌ Execution failed: {{str(e)}}", file=sys.stderr)
        print("=" * 60, file=sys.stderr)
        raise
"""

        # Execute in E2B sandbox
        self._add_log(
            execution_id,
            None,
            LogLevel.INFO,
            "🔧 Creating E2B sandbox...",
            {}
        )

        try:
            # Create sandbox with Python environment
            # Use custom template if configured, otherwise use default
            if settings.E2B_TEMPLATE_ID:
                self._add_log(
                    execution_id,
                    None,
                    LogLevel.INFO,
                    f"🎨 Using custom template: {settings.E2B_TEMPLATE_ID}",
                    {}
                )
                sandbox = Sandbox.create(template=settings.E2B_TEMPLATE_ID)
                
                self._add_log(
                    execution_id,
                    None,
                    LogLevel.INFO,
                    "✅ E2B sandbox created with custom template (dependencies pre-installed)",
                    {"sandbox_id": sandbox.sandbox_id}
                )
            else:
                # Default sandbox without template
                sandbox = Sandbox.create()
                
                self._add_log(
                    execution_id,
                    None,
                    LogLevel.INFO,
                    "✅ E2B sandbox created (will install dependencies)",
                    {"sandbox_id": sandbox.sandbox_id}
                )
                
                # Install dependencies only if NOT using custom template
                self._add_log(
                    execution_id,
                    None,
                    LogLevel.INFO,
                    "📦 Installing dependencies...",
                    {}
                )

                install_result = sandbox.run_code("""
import subprocess
import sys

# Install required packages
packages = [
    "langgraph",
    "langchain-openai",
    "langchain-anthropic",
    "langchain-google-genai",
    "langchain-core",
    "httpx"
]

for package in packages:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", package])

print("✅ All packages installed")
""")

                if install_result.error:
                    raise RuntimeError(f"Failed to install dependencies: {install_result.error.name}: {install_result.error.value}")

                self._add_log(
                    execution_id,
                    None,
                    LogLevel.INFO,
                    "✅ Dependencies installed",
                    {}
                )

            # Upload Datasets
            # Scan nodes for dataset nodes
            dataset_nodes = [n for n in graph_data.get("nodes", []) if n["type"] == "dataset"]
            
            if dataset_nodes:
                self._add_log(
                    execution_id,
                    None,
                    LogLevel.INFO,
                    f"📂 Found {len(dataset_nodes)} dataset nodes. Uploading files...",
                    {}
                )
                
                # Create datasets directory
                sandbox.run_code("import os; os.makedirs('/home/user/datasets', exist_ok=True)")
                
                for node in dataset_nodes:
                    dataset_id = node.get("data", {}).get("dataset_id")
                    if not dataset_id:
                        continue
                        
                    # Fetch dataset from DB to get file path
                    dataset = self.db.query(Dataset).filter(Dataset.id == dataset_id).first()
                    
                    if not dataset:
                        self._add_log(
                            execution_id,
                            node["id"],
                            LogLevel.WARNING,
                            f"⚠️ Dataset {dataset_id} not found in database",
                            {}
                        )
                        continue
                        
                    # Read file content
                    try:
                        with open(dataset.file_path, "rb") as f:
                            file_content = f.read()
                            
                        # Upload to sandbox
                        # We use .csv extension by default as per compiler logic
                        remote_path = f"/home/user/datasets/{dataset_id}.csv"
                        sandbox.files.write(remote_path, file_content)
                        
                        self._add_log(
                            execution_id,
                            node["id"],
                            LogLevel.INFO,
                            f"✅ Uploaded dataset: {dataset.name}",
                            {"size_bytes": len(file_content)}
                        )
                    except Exception as e:
                        self._add_log(
                            execution_id,
                            node["id"],
                            LogLevel.ERROR,
                            f"❌ Failed to upload dataset: {str(e)}",
                            {"error": str(e)}
                        )
                        raise

            # Set environment variables for API keys from settings
            env_vars = {
                "OPENAI_API_KEY": settings.OPENAI_API_KEY or "",
                "ANTHROPIC_API_KEY": settings.ANTHROPIC_API_KEY or "",
                "GOOGLE_API_KEY": settings.GOOGLE_API_KEY or "",
            }

            # Execute the workflow code
            self._add_log(
                execution_id,
                None,
                LogLevel.INFO,
                "▶️  Executing workflow...",
                {}
            )

            exec_result = sandbox.run_code(
                execution_wrapper,
                envs=env_vars
            )
            
            # Process stderr logs for node execution events
            self._add_log(
                execution_id,
                None,
                LogLevel.INFO,
                "📝 Processing execution logs...",
                {}
            )
            
            if exec_result.logs.stderr:
                for log_line in exec_result.logs.stderr:
                    # Try to parse as JSON structured log
                    try:
                        log_event = json.loads(log_line.strip())
                        
                        # Only process our structured events
                        if not isinstance(log_event, dict) or "type" not in log_event:
                            continue
                            
                        event_type = log_event.get("type")
                        node_id = log_event.get("node_id")
                        
                        if event_type == "NODE_START":
                            self._add_log(
                                execution_id,
                                node_id,
                                LogLevel.INFO,
                                f"⏳ Executing node: {node_id}",
                                {"node_type": log_event.get("node_type", "unknown")}
                            )
                            
                        elif event_type == "NODE_COMPLETE":
                            self._add_log(
                                execution_id,
                                node_id,
                                LogLevel.INFO,
                                f"✅ Node completed: {node_id}",
                                {"node_type": log_event.get("node_type", "unknown")}
                            )
                            
                        elif event_type == "NODE_ERROR":
                            self._add_log(
                                execution_id,
                                node_id,
                                LogLevel.ERROR,
                                f"❌ Node failed: {log_event.get('error', 'Unknown error')}",
                                {
                                    "node_type": log_event.get("node_type", "unknown"),
                                    "error": log_event.get("error", "Unknown error")
                                }
                            )
                            
                    except (json.JSONDecodeError, ValueError):
                        # Not a JSON log line, skip it
                        pass

            # Check for errors
            if exec_result.error:
                error_msg = f"{exec_result.error.name}: {exec_result.error.value}"
                raise RuntimeError(f"Workflow execution failed: {error_msg}")

            # Parse result from stdout logs
            if not exec_result.logs.stdout:
                raise RuntimeError("No output from workflow execution")

            output_text = exec_result.logs.stdout[-1] if exec_result.logs.stdout else "{}"

            self._add_log(
                execution_id,
                None,
                LogLevel.INFO,
                "📤 Raw output received",
                {"output": output_text[:500]}  # First 500 chars
            )

            # Parse JSON result
            try:
                result = json.loads(output_text)
            except json.JSONDecodeError as e:
                self._add_log(
                    execution_id,
                    None,
                    LogLevel.ERROR,
                    f"Failed to parse output as JSON: {str(e)}",
                    {"output": output_text}
                )
                raise RuntimeError(f"Invalid JSON output: {str(e)}")

            # Close sandbox
            sandbox.kill()

            self._add_log(
                execution_id,
                None,
                LogLevel.INFO,
                "🔒 Sandbox closed",
                {}
            )

            return result

        except Exception as e:
            self._add_log(
                execution_id,
                None,
                LogLevel.ERROR,
                f"Sandbox execution error: {str(e)}",
                {"error_type": type(e).__name__}
            )
            raise

    def _add_log(
        self,
        execution_id: UUID,
        node_id: Optional[str],
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
            data=data or {}
        )
        self.db.add(log)
        self.db.commit()

        # Also print to console for debugging
        emoji = {
            LogLevel.INFO: "ℹ️",
            LogLevel.WARNING: "⚠️",
            LogLevel.ERROR: "❌",
        }.get(level, "📝")

        print(f"{emoji} [{level.value}] {message}")
        if data:
            print(f"   Data: {json.dumps(data, indent=2)}")
