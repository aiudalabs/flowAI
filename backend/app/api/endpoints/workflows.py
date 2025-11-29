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
from app.services.compiler.langgraph_compiler import LangGraphCompiler

router = APIRouter()


@router.post("", response_model=WorkflowResponse, status_code=status.HTTP_201_CREATED)
async def create_workflow(
    workflow: WorkflowCreate,
    db: Session = Depends(get_db)
):
    """Create a new workflow"""
    # Compile the workflow to validate it
    compiler = WorkflowCompiler()
    compiled_code = None
    try:
        graph_dict = workflow.graph_data.model_dump()
        print(f"📝 Creating workflow '{workflow.name}' with {len(graph_dict.get('nodes', []))} nodes")
        compiled_code = compiler.compile(graph_dict)
        print(f"✅ Compilation successful")
    except Exception as e:
        print(f"⚠️ Compilation failed (saving anyway): {str(e)}")
        # We allow saving invalid workflows, but compiled_code will be None
        compiled_code = None

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
            print(f"⚠️ Compilation failed (saving anyway): {str(e)}")
            # We allow saving invalid workflows
            compiled_code = None
            
        update_data["compiled_code"] = compiled_code
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


@router.get("/{workflow_id}/compile")
async def compile_workflow(workflow_id: UUID, db: Session = Depends(get_db)):
    """
    Compile workflow to executable LangGraph Python code.

    This endpoint generates production-ready Python code that can be:
    - Executed locally
    - Deployed to LangGraph Platform
    - Imported into LangGraph Studio for debugging
    """
    # Get workflow
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )

    # Compile to LangGraph code
    compiler = LangGraphCompiler()

    try:
        # Prepare workflow data
        graph_data = workflow.graph_data
        state_schema = graph_data.get("state_schema", [])
        nodes = graph_data.get("nodes", [])
        edges = graph_data.get("edges", [])

        print(f"🔧 Compiling workflow: {workflow.name}")
        print(f"📊 State schema: {len(state_schema)} fields")
        print(f"🔢 Nodes: {len(nodes)}")
        print(f"🔗 Edges: {len(edges)}")

        # Compile
        code = compiler.compile({
            "name": workflow.name,
            "state_schema": state_schema,
            "nodes": nodes,
            "edges": edges
        })

        print(f"✅ Compilation successful! Generated {len(code)} characters of code")

        return {
            "workflow_id": str(workflow_id),
            "workflow_name": workflow.name,
            "code": code,
            "language": "python",
            "runtime": "langgraph",
            "lines_of_code": len(code.split("\\n"))
        }

    except Exception as e:
        print(f"❌ Compilation failed: {str(e)}")
        import traceback
        traceback.print_exc()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Compilation failed: {str(e)}"
        )
