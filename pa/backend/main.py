from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from database import connect_db
from routers import auth, users, teams, production, targets, settings, dashboard, excel
from utils.seed import seed_superadmin


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    await seed_superadmin()
    yield


app = FastAPI(title="Production Analyst API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(teams.router, prefix="/api/teams", tags=["Teams"])
app.include_router(production.router, prefix="/api/production", tags=["Production"])
app.include_router(targets.router, prefix="/api/targets", tags=["Targets"])
app.include_router(settings.router, prefix="/api/settings", tags=["Settings"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(excel.router, prefix="/api/excel", tags=["Excel Import"])


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "Production Analyst API"}
