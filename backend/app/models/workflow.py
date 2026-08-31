from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class WorkflowTrigger(str, Enum):
    issue_created = "issue_created"
    issue_status_changed = "issue_status_changed"
    issue_assigned = "issue_assigned"
    sprint_started = "sprint_started"
    sprint_completed = "sprint_completed"


class WorkflowCondition(BaseModel):
    field: str
    operator: str  # equals | not_equals | contains | in
    value: Any


class WorkflowAction(BaseModel):
    type: str  # set_status | set_assignee | add_label | send_notification
    params: Dict[str, Any] = {}


class WorkflowBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    trigger: WorkflowTrigger
    conditions: List[WorkflowCondition] = []
    actions: List[WorkflowAction] = []
    enabled: bool = True


class WorkflowCreate(WorkflowBase):
    project_id: str


class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    conditions: Optional[List[WorkflowCondition]] = None
    actions: Optional[List[WorkflowAction]] = None
    enabled: Optional[bool] = None


class WorkflowInDB(WorkflowBase):
    id: Optional[str] = Field(default=None, alias="_id")
    project_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}


class WorkflowResponse(WorkflowBase):
    id: str
    project_id: str
    created_at: datetime

    model_config = {"populate_by_name": True}
