from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

from database import get_database
from middleware.auth import get_current_user, require_admin_or_superadmin
from utils.helpers import serialize_doc

router = APIRouter()


class SettingsUpdate(BaseModel):
    theme: Optional[str] = None
    notifications_enabled: Optional[bool] = None
    role_permissions: Optional[Dict[str, Any]] = None


@router.get("/")
async def get_settings(current_user: dict = Depends(get_current_user)):
    db = get_database()
    settings = await db.settings.find_one({"type": "global"})
    return serialize_doc(settings) if settings else {}


@router.put("/")
async def update_settings(update: SettingsUpdate, current_user: dict = Depends(require_admin_or_superadmin)):
    db = get_database()
    update_dict = {k: v for k, v in update.dict().items() if v is not None}
    update_dict["updated_at"] = datetime.utcnow()
    await db.settings.update_one({"type": "global"}, {"$set": update_dict}, upsert=True)
    return {"message": "Settings updated"}
