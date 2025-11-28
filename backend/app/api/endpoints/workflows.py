from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.models.workflow import Workflow
from app.schemas.workflow import (
    WorkflowCreate,
    WorkflowUpdate,
    WorkflowResponse,
    WorkflowListResponse
)
from app.services.compiler.compiler import WorkflowCompiler

router = APIRouter()


@router.post("", response_model=WorkflowResponse, status_code=status.HTTP_201_CREATED)
async def create_workflow(
    workflow: WorkflowCreate,
    db: Session = Depends(get_db)
):
    """Create a new workflow"""
    # Compile the workflow to validate it
    compiler = WorkflowCompiler()
    try:
        graph_dict = workflow.graph_data.model_dump()
        print(f"📝 Creating workflow '{workflow.name}' with {len(graph_dict.get('nodes', []))} nodes")
        compiled_code = compiler.compile(graph_dict)
        print(f"✅ Compilation successful")
    except Exception as e:
        print(f"❌ Compilation failed: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid workflow: {str(e)}"
        )

    # Create database entry
    db_workflow = Workflow(
        name=workflow.name,
        description=workflow.description,
        graph_data=workflow.graph_data.model_dump(),
        compiled_code=compiled_code
    )
    db.add(db_workflow)
    db.commit()
    db.refresh(db_workflow)

    return db_workflow


@router.get("", response_model=List[WorkflowListResponse])
def list_workflows(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all workflows"""
    workflows = db.query(Workflow).offset(skip).limit(limit).all()
    return workflows


@router.get("/{workflow_id}", response_model=WorkflowResponse)
def get_workflow(workflow_id: UUID, db: Session = Depends(get_db)):
    """Get a specific workflow"""
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )
    return workflow


@router.put("/{workflow_id}", response_model=WorkflowResponse)
async def update_workflow(
    workflow_id: UUID,
    workflow_update: WorkflowUpdate,
    db: Session = Depends(get_db)
):
    """Update a workflow"""
    db_workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not db_workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )

    # Update fields
    update_data = workflow_update.model_dump(exclude_unset=True)
    print(f"📝 Update data received: {update_data.keys()}")

    # If graph_data is updated, recompile
    if "graph_data" in update_data:
        compiler = WorkflowCompiler()
        try:
            # Convert GraphData model to dict if needed
            graph_dict = update_data["graph_data"]
            if hasattr(graph_dict, 'model_dump'):
                graph_dict = graph_dict.model_dump()

            print(f"📊 Compiling graph with {len(graph_dict.get('nodes', []))} nodes")
            compiled_code = compiler.compile(graph_dict)
            update_data["compiled_code"] = compiled_code
            print(f"✅ Compilation successful")
        except Exception as e:
            print(f"❌ Compilation failed: {str(e)}")
            import traceback
            traceback.print_exc()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid workflow: {str(e)}"
            )
        # Ensure graph_data is a dict for storage
        update_data["graph_data"] = graph_dict

    for field, value in update_data.items():
        setattr(db_workflow, field, value)

    db.commit()
    db.refresh(db_workflow)

    return db_workflow


@router.delete("/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workflow(workflow_id: UUID, db: Session = Depends(get_db)):
    """Delete a workflow"""
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )

    db.delete(workflow)
    db.commit()
    return None
