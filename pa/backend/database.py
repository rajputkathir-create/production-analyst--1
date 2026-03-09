from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING
import os

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "production_analyst")

client: AsyncIOMotorClient = None
database = None


async def connect_db():
    global client, database
    client = AsyncIOMotorClient(MONGO_URL)
    database = client[DB_NAME]
    await create_indexes()
    print(f"Connected to MongoDB: {DB_NAME}")


async def create_indexes():
    try:
        await database.users.create_index([("username", ASCENDING)], unique=True)
        await database.production_entries.create_index([("date", ASCENDING), ("user_id", ASCENDING)])
        await database.targets.create_index([("team_id", ASCENDING), ("user_id", ASCENDING)])
    except Exception as e:
        print(f"Index creation warning: {e}")


def get_database():
    return database
