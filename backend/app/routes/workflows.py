from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.middleware.auth import get_current_user
from app.database import get_workflows_collection, get_projects_collection
from app.models.workflow import WorkflowCreate, WorkflowUpdate, WorkflowResponse
from app.utils.helpers import serialize_doc, to_object_id
from datetime import datetime

router = APIRouter(prefix="/projects", tags=["workflows"])


@router.get("/{project_id}/workflows", response_model=List[WorkflowResponse])
async def list_workflows(project_id: str, current_user=Depends(get_current_user)):
    workflows = get_workflows_collection()
    cursor = workflows.find({"project_id": project_id})
    docs = await cursor.to_list(length=100)
    return [WorkflowResponse(**serialize_doc(d)) for d in docs]


@router.post("/{project_id}/workflows", response_model=WorkflowResponse, status_code=status.HTTP_201_CREATED)
async def create_workflow(
    project_id: str, workflow_data: WorkflowCreate, current_user=Depends(get_current_user)
):
    workflows = get_workflows_collection()
    doc = {
        **workflow_data.model_dump(),
        "project_id": project_id,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    result = await workflows.insert_one(doc)
    doc["_id"] = result.inserted_id
    return WorkflowResponse(**serialize_doc(doc))


@router.put("/{project_id}/workflows/{workflow_id}", response_model=WorkflowResponse)
async def update_workflow(
    project_id: str, workflow_id: str,
    update_data: WorkflowUpdate, current_user=Depends(get_current_user)
):
    workflows = get_workflows_collection()
    doc = await workflows.find_one({"_id": to_object_id(workflow_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Workflow not found")

    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.utcnow()
    await workflows.update_one({"_id": to_object_id(workflow_id)}, {"$set": update_dict})
    doc = await workflows.find_one({"_id": to_object_id(workflow_id)})
    return WorkflowResponse(**serialize_doc(doc))


@router.delete("/{project_id}/workflows/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workflow(
    project_id: str, workflow_id: str, current_user=Depends(get_current_user)
):
    workflows = get_workflows_collection()
    await workflows.delete_one({"_id": to_object_id(workflow_id)})
