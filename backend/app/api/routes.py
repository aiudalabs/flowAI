from fastapi import APIRouter
from app.api.endpoints import auth, workflows, executions, datasets

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(workflows.router, prefix="/workflows", tags=["workflows"])
api_router.include_router(executions.router, prefix="/executions", tags=["executions"])
api_router.include_router(datasets.router, prefix="/datasets", tags=["datasets"])
api_router.include_router(auth.router)  # Auth router uses its own prefix
