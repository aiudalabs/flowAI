from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime


class DatasetColumn(BaseModel):
    name: str
    type: str
    sample_values: Optional[List[Any]] = None


class DatasetBase(BaseModel):
    name: str
    description: Optional[str] = None


class DatasetCreate(DatasetBase):
    pass


class DatasetUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class DatasetResponse(DatasetBase):
    id: UUID
    user_id: Optional[UUID] = None
    file_type: str
    size_bytes: int
    row_count: Optional[int] = None
    columns: Optional[List[DatasetColumn]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DatasetListResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    file_type: str
    size_bytes: int
    row_count: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DatasetPreview(BaseModel):
    columns: List[str]
    data: List[Dict[str, Any]]
