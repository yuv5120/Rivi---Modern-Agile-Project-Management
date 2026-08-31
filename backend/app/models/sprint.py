from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class SprintStatus(str, Enum):
    planning = "planning"
    active = "active"
    completed = "completed"


class SprintBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    goal: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class SprintCreate(SprintBase):
    project_id: str


class SprintUpdate(BaseModel):
    name: Optional[str] = None
    goal: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class SprintInDB(SprintBase):
    id: Optional[str] = Field(default=None, alias="_id")
    project_id: str
    status: SprintStatus = SprintStatus.planning
    issue_ids: List[str] = []
    completed_issue_ids: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}


class SprintResponse(SprintBase):
    id: str
    project_id: str
    status: SprintStatus
    issue_ids: List[str] = []
    completed_issue_ids: List[str] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"populate_by_name": True}


class AddIssueToSprint(BaseModel):
    issue_id: str


class CompleteSprintOptions(BaseModel):
    move_incomplete_to_backlog: bool = True
    new_sprint_id: Optional[str] = None  # Move incomplete to another sprint
