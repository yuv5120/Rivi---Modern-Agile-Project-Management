from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class CommentBase(BaseModel):
    body: str = Field(..., min_length=1)


class CommentCreate(CommentBase):
    pass


class CommentUpdate(BaseModel):
    body: str = Field(..., min_length=1)


class CommentInDB(CommentBase):
    id: Optional[str] = Field(default=None, alias="_id")
    issue_id: str
    author_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}


class CommentResponse(CommentBase):
    id: str
    issue_id: str
    author_id: str
    author_username: Optional[str] = None
    author_avatar: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"populate_by_name": True}
