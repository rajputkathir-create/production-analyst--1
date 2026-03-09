from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from bson import ObjectId

from database import get_database
from middleware.auth import get_current_user, require_admin_or_superadmin
from utils.helpers import serialize_doc

router = APIRouter()


class TargetCreate(BaseModel):
    team_id: Optional[str] = None
    team_name: Optional[str] = None
    user_id: Optional[str] = None
    user_name: Optional[str] = None
    target_value: float
    period: str = "daily"
    effective_date: Optional[str] = None


class TargetUpdate(BaseModel):
    target_value: Optional[float] = None
    period: Optional[str] = None
    effective_date: Optional[str] = None


@router.get("/")
async def get_targets(
    team_id: Optional[str] = None,
    user_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    query = {}
    if team_id:
        query["team_id"] = team_id
    if user_id:
        query["user_id"] = user_id
    cursor = db.targets.find(query).sort("created_at", -1)
    targets = []
    async for t in cursor:
        targets.append(serialize_doc(t))
    return targets


@router.post("/")
async def create_target(target: TargetCreate, current_user: dict = Depends(require_admin_or_superadmin)):
    db = get_database()
    new_target = {
        "team_id": target.team_id,
        "team_name": target.team_name,
        "user_id": target.user_id,
        "user_name": target.user_name,
        "target_value": target.target_value,
        "period": target.period,
        "effective_date": target.effective_date,
        "created_by": str(current_user["_id"]),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    result = await db.targets.insert_one(new_target)
    new_target["_id"] = result.inserted_id
    return serialize_doc(new_target)


@router.put("/{target_id}")
async def update_target(target_id: str, update: TargetUpdate, current_user: dict = Depends(require_admin_or_superadmin)):
    db = get_database()
    update_dict = {k: v for k, v in update.dict().items() if v is not None}
    update_dict["updated_at"] = datetime.utcnow()
    result = await db.targets.update_one({"_id": ObjectId(target_id)}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Target not found")
    return {"message": "Target updated"}


@router.delete("/{target_id}")
async def delete_target(target_id: str, current_user: dict = Depends(require_admin_or_superadmin)):
    db = get_database()
    await db.targets.delete_one({"_id": ObjectId(target_id)})
    return {"message": "Target deleted"}
