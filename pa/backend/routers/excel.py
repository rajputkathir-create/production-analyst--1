from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from typing import Optional
import pandas as pd
import io
from datetime import datetime

from database import get_database
from middleware.auth import require_tl_or_above
from utils.helpers import calculate_production_percentage

router = APIRouter()


@router.post("/import")
async def import_excel(
    file: UploadFile = File(...),
    team_col: str = "team_name",
    client_col: Optional[str] = "client_name",
    user_col: str = "user_name",
    production_col: str = "production_value",
    target_col: str = "target_value",
    date_col: str = "date",
    current_user: dict = Depends(require_tl_or_above)
):
    if not file.filename.endswith((".xlsx", ".xls", ".csv")):
        raise HTTPException(status_code=400, detail="Only Excel and CSV files are supported")

    content = await file.read()
    try:
        if file.filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content))
        else:
            df = pd.read_excel(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")

    df.columns = df.columns.str.strip().str.lower().str.replace(" ", "_")

    required_cols = [team_col.lower(), user_col.lower(), production_col.lower(), date_col.lower()]
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing columns: {missing}. Available: {list(df.columns)}")

    db = get_database()
    inserted = 0
    errors = []

    for idx, row in df.iterrows():
        try:
            prod_val = float(row[production_col.lower()])
            tgt_val = float(row[target_col.lower()]) if target_col.lower() in df.columns else 0
            date_val = str(row[date_col.lower()])

            entry = {
                "team_id": None,
                "team_name": str(row[team_col.lower()]),
                "user_id": None,
                "user_name": str(row[user_col.lower()]),
                "client_name": str(row[client_col.lower()]) if client_col and client_col.lower() in df.columns else None,
                "date": date_val,
                "production_value": prod_val,
                "target_value": tgt_val,
                "production_percentage": calculate_production_percentage(prod_val, tgt_val),
                "import_source": file.filename,
                "created_by": str(current_user["_id"]),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            team = await db.teams.find_one({"name": entry["team_name"]})
            if team:
                entry["team_id"] = str(team["_id"])

            user = await db.users.find_one({"full_name": entry["user_name"]})
            if user:
                entry["user_id"] = str(user["_id"])

            await db.production_entries.insert_one(entry)
            inserted += 1
        except Exception as e:
            errors.append({"row": idx + 2, "error": str(e)})

    return {
        "message": f"Import complete. {inserted} records imported.",
        "inserted": inserted,
        "errors": errors,
        "total_rows": len(df)
    }


@router.get("/template")
async def get_template_columns():
    return {
        "columns": ["team_name", "client_name", "user_name", "production_value", "target_value", "date"],
        "sample_data": [
            {"team_name": "Team Alpha", "client_name": "Client A", "user_name": "John Doe",
             "production_value": 850, "target_value": 1000, "date": "2024-01-15"}
        ]
    }
