from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from app.middleware.auth import get_current_user
from app.database import get_issues_collection, get_projects_collection, get_users_collection
from app.models.issue import IssueCreate, IssueUpdate, IssueResponse, IssueStatusUpdate
from app.utils.helpers import serialize_doc, to_object_id
from datetime import datetime

router = APIRouter(tags=["issues"])


async def get_project_or_404(project_id: str, current_user: dict):
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


@router.get("/projects/{project_id}/issues", response_model=List[IssueResponse])
async def list_issues(
    project_id: str,
    status: Optional[str] = Query(None),
    assignee_id: Optional[str] = Query(None),
    sprint_id: Optional[str] = Query(None),
    label: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    current_user=Depends(get_current_user),
):
    await get_project_or_404(project_id, current_user)
    issues = get_issues_collection()
    users = get_users_collection()

    query = {"project_id": project_id}
    if status:
        query["status"] = status
    if assignee_id:
        query["assignee_id"] = assignee_id
    if sprint_id:
        query["sprint_id"] = sprint_id
    if label:
        query["labels"] = label
    if type:
        query["type"] = type
    if priority:
        query["priority"] = priority

    cursor = issues.find(query).sort("created_at", -1)
    docs = await cursor.to_list(length=500)

    result = []
    for doc in docs:
        issue = serialize_doc(doc)
        # Enrich with username
        if issue.get("assignee_id"):
            assignee = await users.find_one({"_id": to_object_id(issue["assignee_id"])})
            if assignee:
                issue["assignee_username"] = assignee.get("username")
        if issue.get("reporter_id"):
            reporter = await users.find_one({"_id": to_object_id(issue["reporter_id"])})
            if reporter:
                issue["reporter_username"] = reporter.get("username")
        result.append(IssueResponse(**issue))
    return result


@router.post("/projects/{project_id}/issues", response_model=IssueResponse, status_code=status.HTTP_201_CREATED)
async def create_issue(
    project_id: str, issue_data: IssueCreate, current_user=Depends(get_current_user)
):
    project = await get_project_or_404(project_id, current_user)
    projects = get_projects_collection()
    issues = get_issues_collection()

    # Auto-increment issue counter
    updated = await projects.find_one_and_update(
        {"_id": to_object_id(project_id)},
        {"$inc": {"issue_counter": 1}},
        return_document=True,
    )
    issue_number = updated["issue_counter"]
    issue_key = f"{project['key']}-{issue_number}"

    doc = {
        **issue_data.model_dump(),
        "project_id": project_id,
        "key": issue_key,
        "reporter_id": current_user["id"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    result = await issues.insert_one(doc)
    doc["_id"] = result.inserted_id
    issue = serialize_doc(doc)

    users = get_users_collection()
    if issue.get("assignee_id"):
        assignee = await users.find_one({"_id": to_object_id(issue["assignee_id"])})
        if assignee:
            issue["assignee_username"] = assignee.get("username")
    reporter = await users.find_one({"_id": to_object_id(issue["reporter_id"])})
    if reporter:
        issue["reporter_username"] = reporter.get("username")

    return IssueResponse(**issue)


@router.get("/issues/{issue_id}", response_model=IssueResponse)
async def get_issue(issue_id: str, current_user=Depends(get_current_user)):
    issues = get_issues_collection()
    doc = await issues.find_one({"_id": to_object_id(issue_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Issue not found")
    issue = serialize_doc(doc)
    await get_project_or_404(issue["project_id"], current_user)

    users = get_users_collection()
    if issue.get("assignee_id"):
        assignee = await users.find_one({"_id": to_object_id(issue["assignee_id"])})
        if assignee:
            issue["assignee_username"] = assignee.get("username")
    reporter = await users.find_one({"_id": to_object_id(issue["reporter_id"])})
    if reporter:
        issue["reporter_username"] = reporter.get("username")
    return IssueResponse(**issue)


@router.put("/issues/{issue_id}", response_model=IssueResponse)
async def update_issue(
    issue_id: str, update_data: IssueUpdate, current_user=Depends(get_current_user)
):
    issues = get_issues_collection()
    doc = await issues.find_one({"_id": to_object_id(issue_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Issue not found")

    issue = serialize_doc(doc)
    await get_project_or_404(issue["project_id"], current_user)

    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.utcnow()

    await issues.update_one({"_id": to_object_id(issue_id)}, {"$set": update_dict})
    doc = await issues.find_one({"_id": to_object_id(issue_id)})
    updated = serialize_doc(doc)

    users = get_users_collection()
    if updated.get("assignee_id"):
        assignee = await users.find_one({"_id": to_object_id(updated["assignee_id"])})
        if assignee:
            updated["assignee_username"] = assignee.get("username")
    reporter = await users.find_one({"_id": to_object_id(updated["reporter_id"])})
    if reporter:
        updated["reporter_username"] = reporter.get("username")
    return IssueResponse(**updated)


@router.patch("/issues/{issue_id}/status", response_model=IssueResponse)
async def update_issue_status(
    issue_id: str, body: IssueStatusUpdate, current_user=Depends(get_current_user)
):
    issues = get_issues_collection()
    doc = await issues.find_one({"_id": to_object_id(issue_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Issue not found")

    issue = serialize_doc(doc)
    await get_project_or_404(issue["project_id"], current_user)

    await issues.update_one(
        {"_id": to_object_id(issue_id)},
        {"$set": {"status": body.status, "updated_at": datetime.utcnow()}}
    )
    doc = await issues.find_one({"_id": to_object_id(issue_id)})
    return IssueResponse(**serialize_doc(doc))


@router.delete("/issues/{issue_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_issue(issue_id: str, current_user=Depends(get_current_user)):
    issues = get_issues_collection()
    doc = await issues.find_one({"_id": to_object_id(issue_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Issue not found")
    issue = serialize_doc(doc)
    await get_project_or_404(issue["project_id"], current_user)
    await issues.delete_one({"_id": to_object_id(issue_id)})
