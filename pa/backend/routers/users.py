from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from passlib.context import CryptContext
from datetime import datetime
from bson import ObjectId

from database import get_database
from middleware.auth import get_current_user, require_admin_or_superadmin
from utils.helpers import serialize_doc

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class UserCreate(BaseModel):
    username: str
    full_name: str
    email: Optional[str] = None
    password: str
    role: str = "member"
    team_id: Optional[str] = None
    team_name: Optional[str] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    team_id: Optional[str] = None
    team_name: Optional[str] = None
    is_active: Optional[bool] = None


class PasswordReset(BaseModel):
    new_password: str
    confirm_password: str


@router.get("/")
async def get_users(
    team_id: Optional[str] = None,
    role: Optional[str] = None,
    current_user: dict = Depends(require_admin_or_superadmin)
):
    db = get_database()
    query = {}
    if team_id:
        query["team_id"] = team_id
    if role:
        query["role"] = role

    cursor = db.users.find(query).sort("created_at", -1)
    users = []
    async for user in cursor:
        u = serialize_doc(user)
        u.pop("password", None)
        users.append(u)
    return users


@router.post("/")
async def create_user(user_data: UserCreate, current_user: dict = Depends(require_admin_or_superadmin)):
    db = get_database()
    existing = await db.users.find_one({"username": user_data.username})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    hashed = pwd_context.hash(user_data.password)
    new_user = {
        "username": user_data.username,
        "full_name": user_data.full_name,
        "email": user_data.email,
        "password": hashed,
        "role": user_data.role,
        "team_id": user_data.team_id,
        "team_name": user_data.team_name,
        "is_active": True,
        "must_change_password": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "created_by": str(current_user["_id"])
    }
    result = await db.users.insert_one(new_user)
    new_user["_id"] = result.inserted_id
    u = serialize_doc(new_user)
    u.pop("password", None)
    return u


@router.get("/{user_id}")
async def get_user(user_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    u = serialize_doc(user)
    u.pop("password", None)
    return u


@router.put("/{user_id}")
async def update_user(user_id: str, update_data: UserUpdate, current_user: dict = Depends(require_admin_or_superadmin)):
    db = get_database()
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    update_dict["updated_at"] = datetime.utcnow()
    result = await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User updated successfully"}


@router.post("/{user_id}/reset-password")
async def reset_password(user_id: str, data: PasswordReset, current_user: dict = Depends(require_admin_or_superadmin)):
    if data.new_password != data.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    db = get_database()
    hashed = pwd_context.hash(data.new_password)
    result = await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"password": hashed, "must_change_password": True, "updated_at": datetime.utcnow()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "Password reset successfully"}


@router.delete("/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(require_admin_or_superadmin)):
    if current_user["role"] != "super_admin":
        raise HTTPException(status_code=403, detail="Only Super Admin can delete users")
    db = get_database()
    result = await db.users.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}
