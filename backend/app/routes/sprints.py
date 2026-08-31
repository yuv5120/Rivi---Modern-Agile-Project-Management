from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.middleware.auth import get_current_user
from app.database import get_sprints_collection, get_issues_collection, get_projects_collection
from app.models.sprint import SprintCreate, SprintUpdate, SprintResponse, AddIssueToSprint, CompleteSprintOptions
from app.utils.helpers import serialize_doc, to_object_id
from datetime import datetime

router = APIRouter(tags=["sprints"])


async def get_project_access(project_id: str, current_user: dict):
    projects = get_projects_collection()
    project = await projects.find_one({"_id": to_object_id(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project_dict = serialize_doc(project)
    user_id = current_user["id"]
    is_owner = project_dict["owner_id"] == user_id
    is_member = any(m["user_id"] == user_id for m in project_dict.get("members", []))
    if not is_owner and not is_member:
        raise HTTPException(status_code=403, detail="Access denied")
    return project_dict


@router.get("/projects/{project_id}/sprints", response_model=List[SprintResponse])
async def list_sprints(project_id: str, current_user=Depends(get_current_user)):
    await get_project_access(project_id, current_user)
    sprints = get_sprints_collection()
    cursor = sprints.find({"project_id": project_id}).sort("created_at", -1)
    docs = await cursor.to_list(length=100)
    return [SprintResponse(**serialize_doc(d)) for d in docs]


@router.post("/projects/{project_id}/sprints", response_model=SprintResponse, status_code=status.HTTP_201_CREATED)
async def create_sprint(
    project_id: str, sprint_data: SprintCreate, current_user=Depends(get_current_user)
):
    await get_project_access(project_id, current_user)
    sprints = get_sprints_collection()

    doc = {
        **sprint_data.model_dump(),
        "project_id": project_id,
        "status": "planning",
        "issue_ids": [],
        "completed_issue_ids": [],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    result = await sprints.insert_one(doc)
    doc["_id"] = result.inserted_id
    return SprintResponse(**serialize_doc(doc))


@router.get("/sprints/{sprint_id}", response_model=SprintResponse)
async def get_sprint(sprint_id: str, current_user=Depends(get_current_user)):
    sprints = get_sprints_collection()
    doc = await sprints.find_one({"_id": to_object_id(sprint_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Sprint not found")
    sprint = serialize_doc(doc)
    await get_project_access(sprint["project_id"], current_user)
    return SprintResponse(**sprint)


@router.put("/sprints/{sprint_id}", response_model=SprintResponse)
async def update_sprint(
    sprint_id: str, update_data: SprintUpdate, current_user=Depends(get_current_user)
):
    sprints = get_sprints_collection()
    doc = await sprints.find_one({"_id": to_object_id(sprint_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Sprint not found")
    sprint = serialize_doc(doc)
    await get_project_access(sprint["project_id"], current_user)

    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.utcnow()
    await sprints.update_one({"_id": to_object_id(sprint_id)}, {"$set": update_dict})
    doc = await sprints.find_one({"_id": to_object_id(sprint_id)})
    return SprintResponse(**serialize_doc(doc))


@router.post("/sprints/{sprint_id}/start", response_model=SprintResponse)
async def start_sprint(sprint_id: str, current_user=Depends(get_current_user)):
    sprints = get_sprints_collection()
    doc = await sprints.find_one({"_id": to_object_id(sprint_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Sprint not found")
    sprint = serialize_doc(doc)
    await get_project_access(sprint["project_id"], current_user)

    if sprint["status"] != "planning":
        raise HTTPException(status_code=400, detail="Only planning sprints can be started")

    # Check no other active sprint in same project
    active = await sprints.find_one({"project_id": sprint["project_id"], "status": "active"})
    if active:
        raise HTTPException(status_code=400, detail="Another sprint is already active")

    await sprints.update_one(
        {"_id": to_object_id(sprint_id)},
        {"$set": {"status": "active", "start_date": datetime.utcnow(), "updated_at": datetime.utcnow()}}
    )
    doc = await sprints.find_one({"_id": to_object_id(sprint_id)})
    return SprintResponse(**serialize_doc(doc))


@router.post("/sprints/{sprint_id}/complete", response_model=SprintResponse)
async def complete_sprint(
    sprint_id: str, options: CompleteSprintOptions, current_user=Depends(get_current_user)
):
    sprints = get_sprints_collection()
    issues = get_issues_collection()
    doc = await sprints.find_one({"_id": to_object_id(sprint_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Sprint not found")
    sprint = serialize_doc(doc)
    await get_project_access(sprint["project_id"], current_user)

    if sprint["status"] != "active":
        raise HTTPException(status_code=400, detail="Only active sprints can be completed")

    # Find incomplete issues
    incomplete_cursor = issues.find(
        {"sprint_id": sprint_id, "status": {"$ne": "done"}}
    )
    incomplete = await incomplete_cursor.to_list(length=500)

    if options.move_incomplete_to_backlog:
        for issue in incomplete:
            await issues.update_one(
                {"_id": issue["_id"]},
                {"$set": {"sprint_id": None, "status": "backlog", "updated_at": datetime.utcnow()}}
            )

    completed_ids = [str(i["_id"]) for i in await issues.find(
        {"sprint_id": sprint_id, "status": "done"}
    ).to_list(length=500)]

    await sprints.update_one(
        {"_id": to_object_id(sprint_id)},
        {"$set": {
            "status": "completed",
            "end_date": datetime.utcnow(),
            "completed_issue_ids": completed_ids,
            "updated_at": datetime.utcnow()
        }}
    )
    doc = await sprints.find_one({"_id": to_object_id(sprint_id)})
    return SprintResponse(**serialize_doc(doc))


@router.post("/sprints/{sprint_id}/issues")
async def add_issue_to_sprint(
    sprint_id: str, body: AddIssueToSprint, current_user=Depends(get_current_user)
):
    sprints = get_sprints_collection()
    issues = get_issues_collection()

    sprint = await sprints.find_one({"_id": to_object_id(sprint_id)})
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")
    sprint_dict = serialize_doc(sprint)
    await get_project_access(sprint_dict["project_id"], current_user)

    issue = await issues.find_one({"_id": to_object_id(body.issue_id)})
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    await issues.update_one(
        {"_id": to_object_id(body.issue_id)},
        {"$set": {"sprint_id": sprint_id, "status": "todo", "updated_at": datetime.utcnow()}}
    )
    await sprints.update_one(
        {"_id": to_object_id(sprint_id)},
        {"$addToSet": {"issue_ids": body.issue_id}}
    )
    return {"message": "Issue added to sprint"}


@router.delete("/sprints/{sprint_id}/issues/{issue_id}")
async def remove_issue_from_sprint(
    sprint_id: str, issue_id: str, current_user=Depends(get_current_user)
):
    sprints = get_sprints_collection()
    issues = get_issues_collection()

    sprint = await sprints.find_one({"_id": to_object_id(sprint_id)})
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")
    sprint_dict = serialize_doc(sprint)
    await get_project_access(sprint_dict["project_id"], current_user)

    await issues.update_one(
        {"_id": to_object_id(issue_id)},
        {"$set": {"sprint_id": None, "status": "backlog", "updated_at": datetime.utcnow()}}
    )
    await sprints.update_one(
        {"_id": to_object_id(sprint_id)},
        {"$pull": {"issue_ids": issue_id}}
    )
    return {"message": "Issue removed from sprint"}
