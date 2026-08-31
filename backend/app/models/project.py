from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class BoardType(str, Enum):
    kanban = "kanban"
    scrum = "scrum"


class ProjectMember(BaseModel):
    user_id: str
    username: str
    role: str = "member"  # member | admin | viewer


class ProjectBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    key: str = Field(..., min_length=2, max_length=10)  # e.g., "PROJ"
    description: Optional[str] = None
    board_type: BoardType = BoardType.scrum
    icon: Optional[str] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    board_type: Optional[BoardType] = None
    icon: Optional[str] = None


class ProjectInDB(ProjectBase):
    id: Optional[str] = Field(default=None, alias="_id")
    owner_id: str
    members: List[ProjectMember] = []
    issue_counter: int = 0  # auto-increment for issue keys
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}


class ProjectResponse(ProjectBase):
    id: str
    owner_id: str
    members: List[ProjectMember] = []
    issue_counter: int
    created_at: datetime
    updated_at: datetime

    model_config = {"populate_by_name": True}
