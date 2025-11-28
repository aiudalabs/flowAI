from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import UUID

from app.models.execution import ExecutionStatus, LogLevel


class ExecutionCreate(BaseModel):
    workflow_id: UUID
    input_data: Optional[Dict[str, Any]] = None


class ExecutionLogResponse(BaseModel):
    id: UUID
    node_id: Optional[str]
    level: LogLevel
    message: str
    data: Optional[Dict[str, Any]] = None
    timestamp: datetime

    class Config:
        from_attributes = True


class ExecutionResponse(BaseModel):
    id: UUID
    workflow_id: UUID
    status: ExecutionStatus
    input_data: Optional[Dict[str, Any]] = None
    output_data: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    logs: List[ExecutionLogResponse] = []

    class Config:
        from_attributes = True
