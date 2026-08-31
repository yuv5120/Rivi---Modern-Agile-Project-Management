from fastapi import APIRouter, HTTPException, status
from app.models.user import UserCreate, UserResponse, TokenResponse
from app.database import get_users_collection
from app.utils.auth import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.utils.helpers import serialize_doc
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    users = get_users_collection()

    # Check uniqueness
    existing = await users.find_one({"$or": [{"email": user_data.email}, {"username": user_data.username}]})
    if existing:
        raise HTTPException(status_code=400, detail="Email or username already registered")

    user_doc = {
        "email": user_data.email,
        "username": user_data.username,
        "full_name": user_data.full_name,
        "avatar_url": user_data.avatar_url,
        "role": "member",
        "password_hash": hash_password(user_data.password),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    result = await users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id
    user = serialize_doc(user_doc)

    access_token = create_access_token({"sub": user["id"]})
    refresh_token = create_refresh_token({"sub": user["id"]})

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            username=user["username"],
            full_name=user.get("full_name"),
            avatar_url=user.get("avatar_url"),
            role=user["role"],
            created_at=user["created_at"],
        ),
    )


@router.post("/login", response_model=TokenResponse)
async def login(credentials: LoginRequest):
    users = get_users_collection()
    user = await users.find_one({"email": credentials.email})

    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user = serialize_doc(user)
    access_token = create_access_token({"sub": user["id"]})
    refresh_token = create_refresh_token({"sub": user["id"]})

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            username=user["username"],
            full_name=user.get("full_name"),
            avatar_url=user.get("avatar_url"),
            role=user["role"],
            created_at=user["created_at"],
        ),
    )


@router.post("/refresh")
async def refresh_token(body: RefreshRequest):
    payload = decode_token(body.refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user_id = payload.get("sub")
    users = get_users_collection()
    from bson import ObjectId
    user = await users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    access_token = create_access_token({"sub": user_id})
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/logout")
async def logout():
    # Client-side token removal; add token blacklist here if needed
    return {"message": "Logged out successfully"}
