from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime

from app.core.database import get_db
from app.models.workflow import Workflow
from app.models.execution import Execution, ExecutionStatus, ExecutionLog, LogLevel
from app.schemas.execution import ExecutionCreate, ExecutionResponse
from app.services.executor.executor import WorkflowExecutor

router = APIRouter()


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

    # Start execution asynchronously
    # Note: In production, this should be done via a task queue (Celery/RQ)
    # For MVP, we'll execute synchronously but update status properly
    executor = WorkflowExecutor(db)
    try:
        print(f"🚀 Starting execution...")
        await executor.execute(execution.id, workflow.graph_data)
        print(f"✅ Execution completed successfully")
    except Exception as e:
        print(f"❌ Execution failed: {e}")
        import traceback
        traceback.print_exc()
        # Error handling is done within executor
        pass

    # Refresh to get updated status
    db.refresh(execution)

    print(f"📤 Returning execution with status: {execution.status}")
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


@router.websocket("/ws/{execution_id}")
async def execution_websocket(
    websocket: WebSocket,
    execution_id: UUID,
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
