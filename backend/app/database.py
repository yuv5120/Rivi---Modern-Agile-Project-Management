from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import settings

client: AsyncIOMotorClient = None
db: AsyncIOMotorDatabase = None


async def connect_to_mongo():
    global client, db
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("username", unique=True)
    await db.projects.create_index("key", unique=True)
    await db.issues.create_index([("project_id", 1), ("key", 1)])
    await db.issues.create_index("sprint_id")
    await db.issues.create_index("assignee_id")
    print(f"✅ Connected to MongoDB: {settings.DATABASE_NAME}")


async def close_mongo_connection():
    if client:
        client.close()
        print("🔌 MongoDB connection closed")


def get_db() -> AsyncIOMotorDatabase:
    return db


# Collection accessors
def get_users_collection():
    return db.users


def get_projects_collection():
    return db.projects


def get_issues_collection():
    return db.issues


def get_sprints_collection():
    return db.sprints


def get_comments_collection():
    return db.comments


def get_workflows_collection():
    return db.workflows
