from fastapi import APIRouter, Depends, HTTPException
from app.middleware.auth import get_current_user
from app.database import get_issues_collection, get_sprints_collection, get_projects_collection
from app.utils.helpers import serialize_doc, to_object_id

router = APIRouter(prefix="/projects", tags=["reports"])


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


@router.get("/{project_id}/reports/summary")
async def get_summary(project_id: str, current_user=Depends(get_current_user)):
    await get_project_access(project_id, current_user)
    issues = get_issues_collection()
    sprints = get_sprints_collection()

    total = await issues.count_documents({"project_id": project_id})
    done = await issues.count_documents({"project_id": project_id, "status": "done"})
    in_progress = await issues.count_documents({"project_id": project_id, "status": "in_progress"})
    backlog = await issues.count_documents({"project_id": project_id, "status": "backlog"})
    todo = await issues.count_documents({"project_id": project_id, "status": "todo"})
    bugs = await issues.count_documents({"project_id": project_id, "type": "bug"})
    active_sprint = await sprints.find_one({"project_id": project_id, "status": "active"})

    return {
        "total_issues": total,
        "done": done,
        "in_progress": in_progress,
        "backlog": backlog,
        "todo": todo,
        "bugs": bugs,
        "completion_percentage": round((done / total * 100) if total > 0 else 0, 1),
        "active_sprint": serialize_doc(active_sprint) if active_sprint else None,
    }


@router.get("/{project_id}/reports/velocity")
async def get_velocity(project_id: str, current_user=Depends(get_current_user)):
    await get_project_access(project_id, current_user)
    sprints = get_sprints_collection()
    issues = get_issues_collection()

    completed_sprints = await sprints.find(
        {"project_id": project_id, "status": "completed"}
    ).sort("end_date", 1).to_list(length=10)

    velocity_data = []
    for sprint in completed_sprints:
        sprint_dict = serialize_doc(sprint)
        sprint_id = sprint_dict["id"]
        completed_issues = await issues.find(
            {"sprint_id": sprint_id, "status": "done"}
        ).to_list(length=500)

        story_points = sum(
            (i.get("story_points") or 0) for i in completed_issues
        )
        velocity_data.append({
            "sprint_name": sprint_dict["name"],
            "sprint_id": sprint_id,
            "completed_issues": len(completed_issues),
            "story_points": story_points,
            "start_date": sprint_dict.get("start_date"),
            "end_date": sprint_dict.get("end_date"),
        })

    avg_velocity = (
        round(sum(d["story_points"] for d in velocity_data) / len(velocity_data), 1)
        if velocity_data else 0
    )

    return {"velocity_data": velocity_data, "average_velocity": avg_velocity}


@router.get("/{project_id}/reports/burndown")
async def get_burndown(project_id: str, sprint_id: str = None, current_user=Depends(get_current_user)):
    await get_project_access(project_id, current_user)
    sprints = get_sprints_collection()
    issues = get_issues_collection()

    # Get active sprint if no sprint_id provided
    if not sprint_id:
        sprint = await sprints.find_one({"project_id": project_id, "status": "active"})
    else:
        sprint = await sprints.find_one({"_id": to_object_id(sprint_id)})

    if not sprint:
        return {"burndown_data": [], "sprint": None}

    sprint_dict = serialize_doc(sprint)
    sprint_issues = await issues.find({"sprint_id": sprint_dict["id"]}).to_list(length=500)

    total_points = sum((i.get("story_points") or 1) for i in sprint_issues)
    done_points = sum(
        (i.get("story_points") or 1) for i in sprint_issues if i.get("status") == "done"
    )

    return {
        "sprint": sprint_dict,
        "total_story_points": total_points,
        "completed_story_points": done_points,
        "remaining_story_points": total_points - done_points,
        "issue_count": len(sprint_issues),
        "done_count": sum(1 for i in sprint_issues if i.get("status") == "done"),
    }
