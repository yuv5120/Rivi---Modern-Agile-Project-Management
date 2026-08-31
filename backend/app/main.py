from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import connect_to_mongo, close_mongo_connection

from app.routes import auth, users, projects, issues, sprints, comments, reports, workflows


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()


app = FastAPI(
    title="Rivi — JIRA Clone API",
    description="Full-featured project management API with sprints, boards, and reporting.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(projects.router, prefix="/api")
app.include_router(issues.router, prefix="/api")
app.include_router(sprints.router, prefix="/api")
app.include_router(comments.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(workflows.router, prefix="/api")


@app.get("/")
async def root():
    return {"message": "Rivi API is running 🚀", "docs": "/docs"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
