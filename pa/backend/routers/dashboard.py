from fastapi import APIRouter, Depends
from typing import Optional
from datetime import datetime, timedelta

from database import get_database
from middleware.auth import require_admin_or_superadmin
from utils.helpers import serialize_doc

router = APIRouter()


@router.get("/summary")
async def get_dashboard_summary(
    team_id: Optional[str] = None,
    user_id: Optional[str] = None,
    client_name: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    date_single: Optional[str] = None,
    current_user: dict = Depends(require_admin_or_superadmin)
):
    db = get_database()
    query = {}
    if team_id:
        query["team_id"] = team_id
    if user_id:
        query["user_id"] = user_id
    if client_name:
        query["client_name"] = {"$regex": client_name, "$options": "i"}
    if date_single:
        query["date"] = date_single
    elif date_from or date_to:
        date_q = {}
        if date_from:
            date_q["$gte"] = date_from
        if date_to:
            date_q["$lte"] = date_to
        query["date"] = date_q

    entries = []
    async for e in db.production_entries.find(query):
        entries.append(e)

    total_production = sum(e.get("production_value", 0) for e in entries)
    total_target = sum(e.get("target_value", 0) for e in entries)
    avg_percentage = sum(e.get("production_percentage", 0) for e in entries) / len(entries) if entries else 0

    top_performers = []
    user_stats = {}
    for e in entries:
        uid = e.get("user_id")
        if uid not in user_stats:
            user_stats[uid] = {"user_name": e.get("user_name"), "total_prod": 0, "total_target": 0, "count": 0}
        user_stats[uid]["total_prod"] += e.get("production_value", 0)
        user_stats[uid]["total_target"] += e.get("target_value", 0)
        user_stats[uid]["count"] += 1

    for uid, stats in user_stats.items():
        pct = (stats["total_prod"] / stats["total_target"] * 100) if stats["total_target"] else 0
        top_performers.append({
            "user_id": uid,
            "user_name": stats["user_name"],
            "total_production": stats["total_prod"],
            "total_target": stats["total_target"],
            "percentage": round(pct, 2),
            "entries": stats["count"]
        })
    top_performers.sort(key=lambda x: x["percentage"], reverse=True)

    daily_data = {}
    for e in entries:
        d = e.get("date", "")
        if d not in daily_data:
            daily_data[d] = {"date": d, "production": 0, "target": 0}
        daily_data[d]["production"] += e.get("production_value", 0)
        daily_data[d]["target"] += e.get("target_value", 0)

    daily_trend = sorted(daily_data.values(), key=lambda x: x["date"])
    for item in daily_trend:
        item["percentage"] = round((item["production"] / item["target"] * 100) if item["target"] else 0, 2)

    team_data = {}
    for e in entries:
        tid = e.get("team_id", "")
        if tid not in team_data:
            team_data[tid] = {"team_name": e.get("team_name", ""), "production": 0, "target": 0}
        team_data[tid]["production"] += e.get("production_value", 0)
        team_data[tid]["target"] += e.get("target_value", 0)

    team_performance = list(team_data.values())
    for t in team_performance:
        t["percentage"] = round((t["production"] / t["target"] * 100) if t["target"] else 0, 2)

    return {
        "summary": {
            "total_entries": len(entries),
            "total_production": round(total_production, 2),
            "total_target": round(total_target, 2),
            "avg_percentage": round(avg_percentage, 2),
            "teams_count": len(team_data),
            "users_count": len(user_stats)
        },
        "daily_trend": daily_trend,
        "team_performance": team_performance,
        "top_performers": top_performers[:10]
    }
