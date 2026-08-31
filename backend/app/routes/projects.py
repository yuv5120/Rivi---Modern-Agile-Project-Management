from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.middleware.auth import get_current_user
from app.database import get_projects_collection, get_users_collection
from app.models.project import ProjectCreate, ProjectUpdate, ProjectResponse, ProjectMember
from app.utils.helpers import serialize_doc, serialize_docs, to_object_id
from bson import ObjectId
from datetime import datetime
from pydantic import BaseModel

router = APIRouter(prefix="/projects", tags=["projects"])


def check_project_access(project: dict, user_id: str, require_admin: bool = False) -> bool:
    if project["owner_id"] == user_id:
        return True
    for member in project.get("members", []):
        if member["user_id"] == user_id:
            if require_admin and member["role"] != "admin":
                return False
            return True
    return False


@router.get("/", response_model=List[ProjectResponse])
async def list_projects(current_user=Depends(get_current_user)):
    projects = get_projects_collection()
    user_id = current_user["id"]
    cursor = projects.find({
        "$or": [
            {"owner_id": user_id},
            {"members.user_id": user_id}
        ]
    })
    docs = await cursor.to_list(length=100)
    return [ProjectResponse(**serialize_doc(d)) for d in docs]


@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(project_data: ProjectCreate, current_user=Depends(get_current_user)):
    projects = get_projects_collection()
    # Check key uniqueness
    existing = await projects.find_one({"key": project_data.key.upper()})
    if existing:
        raise HTTPException(status_code=400, detail="Project key already exists")

    doc = {
        **project_data.model_dump(),
        "key": project_data.key.upper(),
        "owner_id": current_user["id"],
        "members": [],
        "issue_counter": 0,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    result = await projects.insert_one(doc)
    doc["_id"] = result.inserted_id
    return ProjectResponse(**serialize_doc(doc))


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str, current_user=Depends(get_current_user)):
    projects = get_projects_collection()
    project = await projects.find_one({"_id": to_object_id(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if not check_project_access(serialize_doc(project), current_user["id"]):
        raise HTTPException(status_code=403, detail="Access denied")
    return ProjectResponse(**serialize_doc(project))


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str, update_data: ProjectUpdate, current_user=Depends(get_current_user)
):
    projects = get_projects_collection()
    project = await projects.find_one({"_id": to_object_id(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    project_dict = serialize_doc(project)
    if project_dict["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only owner can update project")

    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.utcnow()

    await projects.update_one({"_id": to_object_id(project_id)}, {"$set": update_dict})
    project = await projects.find_one({"_id": to_object_id(project_id)})
    return ProjectResponse(**serialize_doc(project))


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(project_id: str, current_user=Depends(get_current_user)):
    projects = get_projects_collection()
    project = await projects.find_one({"_id": to_object_id(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if serialize_doc(project)["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only owner can delete project")
    await projects.delete_one({"_id": to_object_id(project_id)})


class AddMemberRequest(BaseModel):
    username: str
    role: str = "member"


@router.post("/{project_id}/members")
async def add_member(
    project_id: str, body: AddMemberRequest, current_user=Depends(get_current_user)
):
    projects = get_projects_collection()
    users = get_users_collection()

    project = await projects.find_one({"_id": to_object_id(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if serialize_doc(project)["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only owner can add members")

    user = await users.find_one({"username": body.username})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user_data = serialize_doc(user)
    member = {"user_id": user_data["id"], "username": user_data["username"], "role": body.role}

    # Avoid duplicate
    await projects.update_one(
        {"_id": to_object_id(project_id), "members.user_id": {"$ne": user_data["id"]}},
        {"$push": {"members": member}}
    )
    return {"message": "Member added successfully"}


@router.delete("/{project_id}/members/{user_id}")
async def remove_member(
    project_id: str, user_id: str, current_user=Depends(get_current_user)
):
    projects = get_projects_collection()
    project = await projects.find_one({"_id": to_object_id(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if serialize_doc(project)["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only owner can remove members")

    await projects.update_one(
        {"_id": to_object_id(project_id)},
        {"$pull": {"members": {"user_id": user_id}}}
    )
    return {"message": "Member removed"}
