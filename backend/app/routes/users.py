from fastapi import APIRouter, Depends, HTTPException
from app.middleware.auth import get_current_user
from app.database import get_users_collection
from app.models.user import UserUpdate, UserResponse
from app.utils.helpers import serialize_doc
from bson import ObjectId
from datetime import datetime

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def get_me(current_user=Depends(get_current_user)):
    return UserResponse(**current_user)


@router.put("/me", response_model=UserResponse)
async def update_me(update_data: UserUpdate, current_user=Depends(get_current_user)):
    users = get_users_collection()
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.utcnow()

    await users.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$set": update_dict}
    )

    user = await users.find_one({"_id": ObjectId(current_user["id"])})
    return UserResponse(**serialize_doc(user))


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, current_user=Depends(get_current_user)):
    users = get_users_collection()
    user = await users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(**serialize_doc(user))
