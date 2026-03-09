from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
import os

from database import get_database
from middleware.auth import get_current_user, SECRET_KEY, ALGORITHM
from utils.helpers import serialize_doc

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class LoginRequest(BaseModel):
    username: str
    password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str


def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(hours=24))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


@router.post("/login")
async def login(request: LoginRequest):
    db = get_database()
    user = await db.users.find_one({
        "$or": [{"username": request.username}, {"email": request.username}]
    })
    if not user or not pwd_context.verify(request.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.get("is_active", True):
        raise HTTPException(status_code=400, detail="Account is deactivated")

    token = create_access_token({"sub": str(user["_id"]), "role": user["role"]})
    user_data = serialize_doc(user)
    user_data.pop("password", None)
    return {"access_token": token, "token_type": "bearer", "user": user_data}


@router.post("/change-password")
async def change_password(request: ChangePasswordRequest, current_user: dict = Depends(get_current_user)):
    if request.new_password != request.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    if not pwd_context.verify(request.current_password, current_user["password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    db = get_database()
    from bson import ObjectId
    hashed = pwd_context.hash(request.new_password)
    await db.users.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {"$set": {"password": hashed, "must_change_password": False, "updated_at": datetime.utcnow()}}
    )
    return {"message": "Password changed successfully"}


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    user_data = serialize_doc(current_user)
    user_data.pop("password", None)
    return user_data
