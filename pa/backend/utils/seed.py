from passlib.context import CryptContext
from database import get_database
from datetime import datetime

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def seed_superadmin():
    db = get_database()
    existing = await db.users.find_one({"username": "SUPERADMIN"})
    if not existing:
        hashed = pwd_context.hash("SUPERADMIN")
        await db.users.insert_one({
            "username": "SUPERADMIN",
            "full_name": "Super Administrator",
            "email": "superadmin@system.local",
            "password": hashed,
            "role": "super_admin",
            "team_id": None,
            "team_name": None,
            "is_active": True,
            "must_change_password": False,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        })
        print("✅ Default SUPERADMIN account created")

    existing_settings = await db.settings.find_one({"type": "global"})
    if not existing_settings:
        await db.settings.insert_one({
            "type": "global",
            "theme": "dark",
            "notifications_enabled": True,
            "role_permissions": {
                "admin": ["dashboard", "users", "teams", "production", "targets", "settings", "excel"],
                "tl": ["production", "teams"],
                "member": ["production_view"]
            },
            "created_at": datetime.utcnow()
        })
        print("✅ Default settings created")
