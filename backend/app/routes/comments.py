from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.middleware.auth import get_current_user
from app.database import get_comments_collection, get_issues_collection, get_users_collection
from app.models.comment import CommentCreate, CommentUpdate, CommentResponse
from app.utils.helpers import serialize_doc, to_object_id
from datetime import datetime

router = APIRouter(tags=["comments"])


@router.get("/issues/{issue_id}/comments", response_model=List[CommentResponse])
async def list_comments(issue_id: str, current_user=Depends(get_current_user)):
    issues = get_issues_collection()
    issue = await issues.find_one({"_id": to_object_id(issue_id)})
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    comments = get_comments_collection()
    users = get_users_collection()

    cursor = comments.find({"issue_id": issue_id}).sort("created_at", 1)
    docs = await cursor.to_list(length=200)

    result = []
    for doc in docs:
        comment = serialize_doc(doc)
        author = await users.find_one({"_id": to_object_id(comment["author_id"])})
        if author:
            comment["author_username"] = author.get("username")
            comment["author_avatar"] = author.get("avatar_url")
        result.append(CommentResponse(**comment))
    return result


@router.post("/issues/{issue_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def create_comment(
    issue_id: str, comment_data: CommentCreate, current_user=Depends(get_current_user)
):
    issues = get_issues_collection()
    issue = await issues.find_one({"_id": to_object_id(issue_id)})
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    comments = get_comments_collection()
    users = get_users_collection()

    doc = {
        "issue_id": issue_id,
        "author_id": current_user["id"],
        "body": comment_data.body,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    result = await comments.insert_one(doc)
    doc["_id"] = result.inserted_id
    comment = serialize_doc(doc)

    author = await users.find_one({"_id": to_object_id(comment["author_id"])})
    if author:
        comment["author_username"] = author.get("username")
        comment["author_avatar"] = author.get("avatar_url")

    return CommentResponse(**comment)


@router.put("/comments/{comment_id}", response_model=CommentResponse)
async def update_comment(
    comment_id: str, update_data: CommentUpdate, current_user=Depends(get_current_user)
):
    comments = get_comments_collection()
    doc = await comments.find_one({"_id": to_object_id(comment_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Comment not found")

    comment = serialize_doc(doc)
    if comment["author_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Cannot edit another user's comment")

    await comments.update_one(
        {"_id": to_object_id(comment_id)},
        {"$set": {"body": update_data.body, "updated_at": datetime.utcnow()}}
    )
    doc = await comments.find_one({"_id": to_object_id(comment_id)})
    updated = serialize_doc(doc)

    users = get_users_collection()
    author = await users.find_one({"_id": to_object_id(updated["author_id"])})
    if author:
        updated["author_username"] = author.get("username")
        updated["author_avatar"] = author.get("avatar_url")
    return CommentResponse(**updated)


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(comment_id: str, current_user=Depends(get_current_user)):
    comments = get_comments_collection()
    doc = await comments.find_one({"_id": to_object_id(comment_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Comment not found")
    comment = serialize_doc(doc)
    if comment["author_id"] != current_user["id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Cannot delete another user's comment")
    await comments.delete_one({"_id": to_object_id(comment_id)})
