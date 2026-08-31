from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class IssueType(str, Enum):
    story = "story"
    bug = "bug"
    task = "task"
    epic = "epic"
    subtask = "subtask"


class IssuePriority(str, Enum):
    highest = "highest"
    high = "high"
    medium = "medium"
    low = "low"
    lowest = "lowest"


class IssueStatus(str, Enum):
    backlog = "backlog"
    todo = "todo"
    in_progress = "in_progress"
    in_review = "in_review"
    done = "done"


class IssueBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    type: IssueType = IssueType.task
    priority: IssuePriority = IssuePriority.medium
    status: IssueStatus = IssueStatus.backlog
    story_points: Optional[int] = Field(default=None, ge=0, le=100)
    labels: List[str] = []
    assignee_id: Optional[str] = None
    parent_id: Optional[str] = None  # For subtasks / epic links
    due_date: Optional[datetime] = None


class IssueCreate(IssueBase):
    project_id: str
    sprint_id: Optional[str] = None


class IssueUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    type: Optional[IssueType] = None
    priority: Optional[IssuePriority] = None
    status: Optional[IssueStatus] = None
    story_points: Optional[int] = None
    labels: Optional[List[str]] = None
    assignee_id: Optional[str] = None
    sprint_id: Optional[str] = None
    parent_id: Optional[str] = None
    due_date: Optional[datetime] = None


class IssueStatusUpdate(BaseModel):
    status: IssueStatus


class IssueInDB(IssueBase):
    id: Optional[str] = Field(default=None, alias="_id")
    key: str  # e.g., "PROJ-42"
    project_id: str
    sprint_id: Optional[str] = None
    reporter_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}


class IssueResponse(IssueBase):
    id: str
    key: str
    project_id: str
    sprint_id: Optional[str] = None
    reporter_id: str
    created_at: datetime
    updated_at: datetime
    assignee_username: Optional[str] = None  # populated via lookup
    reporter_username: Optional[str] = None

    model_config = {"populate_by_name": True}
