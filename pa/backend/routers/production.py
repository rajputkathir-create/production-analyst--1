from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
from bson import ObjectId

from database import get_database
from middleware.auth import get_current_user, require_tl_or_above
from utils.helpers import serialize_doc, calculate_production_percentage

router = APIRouter()


class ProductionEntry(BaseModel):
    team_id: str
    team_name: str
    user_id: str
    user_name: str
    client_name: Optional[str] = None
    date: str
    production_value: float
    target_value: float
    notes: Optional[str] = None


class ProductionUpdate(BaseModel):
    production_value: Optional[float] = None
    target_value: Optional[float] = None
    client_name: Optional[str] = None
    notes: Optional[str] = None


@router.get("/")
async def get_production_entries(
    team_id: Optional[str] = None,
    user_id: Optional[str] = None,
    client_name: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    date_single: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    query = {}

    if current_user["role"] == "member":
        query["team_id"] = current_user.get("team_id")

    if team_id:
        query["team_id"] = team_id
    if user_id:
        query["user_id"] = user_id
    if client_name:
        query["client_name"] = {"$regex": client_name, "$options": "i"}
    if date_single:
        query["date"] = date_single
    elif date_from or date_to:
        date_query = {}
        if date_from:
            date_query["$gte"] = date_from
        if date_to:
            date_query["$lte"] = date_to
        query["date"] = date_query

    cursor = db.production_entries.find(query).sort("date", -1)
    entries = []
    async for entry in cursor:
        entries.append(serialize_doc(entry))
    return entries


@router.post("/")
async def create_production_entry(entry: ProductionEntry, current_user: dict = Depends(require_tl_or_above)):
    db = get_database()
    percentage = calculate_production_percentage(entry.production_value, entry.target_value)
    new_entry = {
        "team_id": entry.team_id,
        "team_name": entry.team_name,
        "user_id": entry.user_id,
        "user_name": entry.user_name,
        "client_name": entry.client_name,
        "date": entry.date,
        "production_value": entry.production_value,
        "target_value": entry.target_value,
        "production_percentage": percentage,
        "notes": entry.notes,
        "created_by": str(current_user["_id"]),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    result = await db.production_entries.insert_one(new_entry)
    new_entry["_id"] = result.inserted_id
    return serialize_doc(new_entry)


@router.put("/{entry_id}")
async def update_production_entry(entry_id: str, update: ProductionUpdate, current_user: dict = Depends(require_tl_or_above)):
    db = get_database()
    existing = await db.production_entries.find_one({"_id": ObjectId(entry_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Entry not found")

    update_dict = {k: v for k, v in update.dict().items() if v is not None}
    prod_val = update.production_value or existing["production_value"]
    tgt_val = update.target_value or existing["target_value"]
    update_dict["production_percentage"] = calculate_production_percentage(prod_val, tgt_val)
    update_dict["updated_at"] = datetime.utcnow()

    await db.production_entries.update_one({"_id": ObjectId(entry_id)}, {"$set": update_dict})
    updated = await db.production_entries.find_one({"_id": ObjectId(entry_id)})
    return serialize_doc(updated)


@router.delete("/{entry_id}")
async def delete_production_entry(entry_id: str, current_user: dict = Depends(require_tl_or_above)):
    if current_user["role"] not in ["super_admin", "admin"]:
        raise HTTPException(status_code=403, detail="Only admins can delete production entries")
    db = get_database()
    await db.production_entries.delete_one({"_id": ObjectId(entry_id)})
    return {"message": "Entry deleted"}
