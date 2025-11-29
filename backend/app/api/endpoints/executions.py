from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime
import asyncio

from app.core.database import get_db
from app.models.workflow import Workflow
from app.models.execution import Execution, ExecutionStatus, ExecutionLog, LogLevel
from app.schemas.execution import ExecutionCreate, ExecutionResponse
from app.services.executor.langgraph_executor import LangGraphDynamicExecutor

router = APIRouter()


async def _run_execution_background(execution_id: UUID, graph_data: dict):
    """Run execution in the background using real LangGraph"""
    print("="*80)
    print(f"🔄 BACKGROUND TASK STARTED for execution: {execution_id}")
    print("="*80)

    # Create a new database session for the background task
    from app.core.database import SessionLocal
    db = SessionLocal()

    try:
        print(f"📊 Graph data: {len(graph_data.get('nodes', []))} nodes, {len(graph_data.get('edges', []))} edges")

        # Use LangGraphDynamicExecutor for REAL LangGraph execution
        print(f"🔧 Creating LangGraphDynamicExecutor...")
        executor = LangGraphDynamicExecutor(db)
        print(f"✅ Executor created successfully")

        print(f"🚀 Starting LangGraph execution in E2B sandbox...")
        print(f"   Execution ID: {execution_id}")
        print(f"   This may take 60-90 seconds...")

        await executor.execute(execution_id, graph_data)

        print("="*80)
        print(f"✅ BACKGROUND EXECUTION COMPLETED SUCCESSFULLY")
        print("="*80)
    except Exception as e:
        print("="*80)
        print(f"❌ BACKGROUND EXECUTION FAILED")
        print(f"Error: {e}")
        print(f"Type: {type(e).__name__}")
        print("="*80)
        import traceback
        traceback.print_exc()
        print("="*80)
    finally:
        db.close()
        print(f"🔒 Database session closed for execution {execution_id}")


@router.post("", response_model=ExecutionResponse, status_code=status.HTTP_201_CREATED)
async def create_execution(
    execution_create: ExecutionCreate,
    db: Session = Depends(get_db)
):
    """Create and start a workflow execution"""
    print(f"📥 Creating execution for workflow: {execution_create.workflow_id}")

    # Verify workflow exists
    workflow = db.query(Workflow).filter(
        Workflow.id == execution_create.workflow_id
    ).first()

    if not workflow:
        print(f"❌ Workflow not found: {execution_create.workflow_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )

    print(f"✅ Workflow found: {workflow.name}")
    print(f"📊 Graph data: {len(workflow.graph_data.get('nodes', []))} nodes, {len(workflow.graph_data.get('edges', []))} edges")

    # Create execution record
    execution = Execution(
        workflow_id=execution_create.workflow_id,
        input_data=execution_create.input_data,
        status=ExecutionStatus.PENDING,
    )
    db.add(execution)
    db.commit()
    db.refresh(execution)

    print(f"✅ Execution created: {execution.id}")
    print(f"   Status: {execution.status}")
    print(f"   Input data: {execution.input_data}")

    # Start execution asynchronously in the background
    # This allows the API to return immediately while execution runs
    print("="*80)
    print(f"🚀 LAUNCHING BACKGROUND EXECUTION TASK")
    print(f"   Execution ID: {execution.id}")
    print(f"   Workflow: {workflow.name}")
    print("="*80)

    # Create the background task
    task = asyncio.create_task(_run_execution_background(execution.id, workflow.graph_data))
    print(f"✅ Background task created: {task}")
    print(f"   Task done: {task.done()}")
    print(f"   Task cancelled: {task.cancelled()}")

    # Return execution immediately with PENDING status
    # Frontend can subscribe to WebSocket to get real-time updates
    print(f"📤 Returning execution with status: {execution.status}")
    print("="*80)
    return execution


@router.get("/{execution_id}", response_model=ExecutionResponse)
def get_execution(execution_id: UUID, db: Session = Depends(get_db)):
    """Get execution details with logs"""
    execution = db.query(Execution).filter(Execution.id == execution_id).first()
    if not execution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execution not found"
        )
    return execution


@router.get("/workflow/{workflow_id}", response_model=List[ExecutionResponse])
def list_workflow_executions(
    workflow_id: UUID,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """List all executions for a workflow"""
    executions = (
        db.query(Execution)
        .filter(Execution.workflow_id == workflow_id)
        .order_by(Execution.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return executions


from app.core.deps import get_current_user_ws
from app.models.user import User

@router.websocket("/{execution_id}/ws")
async def execution_websocket(
    websocket: WebSocket,
    execution_id: UUID,
    current_user: User = Depends(get_current_user_ws),
    db: Session = Depends(get_db)
):
    """WebSocket endpoint for real-time execution updates"""
    print(f"🔌 WebSocket connection request for execution: {execution_id}")
    await websocket.accept()
    print(f"✅ WebSocket accepted for execution: {execution_id}")

    try:
        # Verify execution exists
        execution = db.query(Execution).filter(Execution.id == execution_id).first()
        if not execution:
            print(f"❌ Execution not found: {execution_id}")
            await websocket.send_json({"error": "Execution not found"})
            await websocket.close()
            return

        print(f"📊 Execution status: {execution.status}")

        # Get all logs immediately
        all_logs = (
            db.query(ExecutionLog)
            .filter(ExecutionLog.execution_id == execution_id)
            .order_by(ExecutionLog.timestamp)
            .all()
        )

        print(f"📝 Found {len(all_logs)} logs for execution {execution_id}")

        # Send initial status
        await websocket.send_json({
            "type": "status",
            "status": execution.status.value,
            "execution_id": str(execution_id)
        })

        # Send all existing logs immediately
        for log in all_logs:
            log_data = {
                "type": "log",
                "log": {
                    "node_id": log.node_id,
                    "level": log.level.value,
                    "message": log.message,
                    "data": log.data,
                    "timestamp": log.timestamp.isoformat()
                }
            }
            await websocket.send_json(log_data)
            print(f"📤 Sent log: {log.message[:50]}...")

        # If already complete, send complete message and close
        if execution.status in [
            ExecutionStatus.COMPLETED,
            ExecutionStatus.FAILED,
            ExecutionStatus.CANCELLED
        ]:
            print(f"✅ Execution already {execution.status.value}, sending complete message")
            await websocket.send_json({
                "type": "complete",
                "status": execution.status.value,
                "output": execution.output_data,
                "error": execution.error_message
            })
            print(f"🔒 Closing WebSocket for completed execution")
            return

        # Otherwise, poll for updates
        # In production, use Redis pub/sub or dedicated message broker
        import asyncio
        sent_log_count = len(all_logs)

        while True:
            await asyncio.sleep(0.3)  # Poll every 300ms

            db.refresh(execution)

            # Send status update
            await websocket.send_json({
                "type": "status",
                "status": execution.status.value,
                "execution_id": str(execution_id)
            })

            # Send only NEW logs
            logs = (
                db.query(ExecutionLog)
                .filter(ExecutionLog.execution_id == execution_id)
                .order_by(ExecutionLog.timestamp)
                .all()
            )

            # Send only logs we haven't sent yet
            new_logs = logs[sent_log_count:]
            for log in new_logs:
                await websocket.send_json({
                    "type": "log",
                    "log": {
                        "node_id": log.node_id,
                        "level": log.level.value,
                        "message": log.message,
                        "data": log.data,
                        "timestamp": log.timestamp.isoformat()
                    }
                })
                print(f"📤 Sent new log: {log.message[:50]}...")

            sent_log_count = len(logs)

            # If execution is complete, send final message and close
            if execution.status in [
                ExecutionStatus.COMPLETED,
                ExecutionStatus.FAILED,
                ExecutionStatus.CANCELLED
            ]:
                print(f"✅ Execution {execution.status.value}, sending complete message")
                await websocket.send_json({
                    "type": "complete",
                    "status": execution.status.value,
                    "output": execution.output_data,
                    "error": execution.error_message
                })
                break

    except WebSocketDisconnect:
        print(f"WebSocket disconnected for execution {execution_id}")
    except Exception as e:
        print(f"WebSocket error: {e}")
        await websocket.send_json({"error": str(e)})
    finally:
        await websocket.close()
