import os
import shutil
import pandas as pd
import json
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.dataset import Dataset
from app.models.user import User
from app.schemas.dataset import (
    DatasetResponse,
    DatasetListResponse,
    DatasetPreview,
    DatasetUpdate,
    DatasetColumn
)
from app.core.deps import get_current_user

router = APIRouter()

# Directory to store uploaded datasets
DATASET_DIR = "data/datasets"
os.makedirs(DATASET_DIR, exist_ok=True)


@router.post("/upload", response_model=DatasetResponse, status_code=status.HTTP_201_CREATED)
async def upload_dataset(
    file: UploadFile = File(...),
    name: str = Form(None),
    description: str = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a new dataset (CSV or JSON).
    """
    # Validate file type
    filename = file.filename
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ['.csv', '.json']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV and JSON files are supported"
        )
    
    file_type = ext.lstrip('.')
    
    # Generate unique filename
    import uuid
    unique_filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(DATASET_DIR, unique_filename)
    
    # Save file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )
        
    # Analyze file
    try:
        if file_type == 'csv':
            df = pd.read_csv(file_path)
        else:
            df = pd.read_json(file_path)
            
        row_count = len(df)
        size_bytes = os.path.getsize(file_path)
        
        # Infer schema
        columns = []
        for col in df.columns:
            dtype = str(df[col].dtype)
            sample = df[col].head(3).tolist()
            # Handle NaN/None for JSON serialization
            sample = [None if pd.isna(x) else x for x in sample]
            
            columns.append({
                "name": col,
                "type": dtype,
                "sample_values": sample
            })
            
    except Exception as e:
        # Clean up file if analysis fails
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse file: {str(e)}"
        )
    
    # Create DB record
    dataset = Dataset(
        user_id=current_user.id,
        name=name or filename,
        description=description,
        file_path=file_path,
        file_type=file_type,
        size_bytes=size_bytes,
        row_count=row_count,
        columns=columns
    )
    
    db.add(dataset)
    db.commit()
    db.refresh(dataset)
    
    return dataset


@router.get("", response_model=List[DatasetListResponse])
def list_datasets(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all datasets for the current user"""
    datasets = db.query(Dataset).filter(Dataset.user_id == current_user.id).offset(skip).limit(limit).all()
    return datasets


@router.get("/{dataset_id}", response_model=DatasetResponse)
def get_dataset(
    dataset_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific dataset"""
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == current_user.id).first()
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found"
        )
    return dataset


@router.get("/{dataset_id}/preview", response_model=DatasetPreview)
def preview_dataset(
    dataset_id: UUID,
    rows: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Preview the first N rows of a dataset"""
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == current_user.id).first()
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found"
        )
        
    try:
        if dataset.file_type == 'csv':
            df = pd.read_csv(dataset.file_path, nrows=rows)
        else:
            # For JSON, we might need to read all and slice if it's not line-delimited
            # Optimizing for large JSONs is out of scope for MVP
            df = pd.read_json(dataset.file_path).head(rows)
            
        # Replace NaN with None for JSON serialization
        df = df.where(pd.notnull(df), None)
        
        return {
            "columns": df.columns.tolist(),
            "data": df.to_dict(orient="records")
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to read dataset: {str(e)}"
        )


@router.delete("/{dataset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_dataset(
    dataset_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a dataset and its file"""
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == current_user.id).first()
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found"
        )
    
    # Remove file
    if os.path.exists(dataset.file_path):
        try:
            os.remove(dataset.file_path)
        except Exception as e:
            print(f"⚠️ Failed to delete file {dataset.file_path}: {e}")
            
    db.delete(dataset)
    db.commit()
    return None
