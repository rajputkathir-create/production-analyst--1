from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from bson import ObjectId

from database import get_database
from middleware.auth import get_current_user, require_admin_or_superadmin
from utils.helpers import serialize_doc

router = APIRouter()


class TeamCreate(BaseModel):
    name: str
    description: Optional[str] = None
    client_name: Optional[str] = None


class TeamUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    client_name: Optional[str] = None
    is_active: Optional[bool] = None


@router.get("/")
async def get_teams(current_user: dict = Depends(get_current_user)):
    db = get_database()
    cursor = db.teams.find({"is_active": True}).sort("name", 1)
    teams = []
    async for team in cursor:
        teams.append(serialize_doc(team))
    return teams


@router.post("/")
async def create_team(team_data: TeamCreate, current_user: dict = Depends(require_admin_or_superadmin)):
    db = get_database()
    existing = await db.teams.find_one({"name": team_data.name})
    if existing:
        raise HTTPException(status_code=400, detail="Team already exists")
    new_team = {
        "name": team_data.name,
        "description": team_data.description,
        "client_name": team_data.client_name,
        "is_active": True,
        "created_at": datetime.utcnow(),
        "created_by": str(current_user["_id"])
    }
    result = await db.teams.insert_one(new_team)
    new_team["_id"] = result.inserted_id
    return serialize_doc(new_team)


@router.put("/{team_id}")
async def update_team(team_id: str, update_data: TeamUpdate, current_user: dict = Depends(require_admin_or_superadmin)):
    db = get_database()
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    update_dict["updated_at"] = datetime.utcnow()
    result = await db.teams.update_one({"_id": ObjectId(team_id)}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Team not found")
    return {"message": "Team updated"}


@router.delete("/{team_id}")
async def delete_team(team_id: str, current_user: dict = Depends(require_admin_or_superadmin)):
    db = get_database()
    await db.teams.update_one({"_id": ObjectId(team_id)}, {"$set": {"is_active": False}})
    return {"message": "Team deactivated"}


@router.get("/{team_id}/members")
async def get_team_members(team_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    cursor = db.users.find({"team_id": team_id, "is_active": True})
    members = []
    async for user in cursor:
        u = serialize_doc(user)
        u.pop("password", None)
        members.append(u)
    return members
