from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.auth import router as auth_router
from app.api.routes.conversations import router as conversations_router
from app.api.routes.conversations_list import router as conversations_list_router
from app.api.routes.summaries import router as summaries_router
from app.api.routes.resume import router as resume_router
from app.api.routes.users import router as users_router
from app.api.routes.projects import router as projects_router
from app.api.routes.memory import router as memory_router


app = FastAPI(title="Ved Memory")

# --------------------------
# CORS Configuration
# --------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # You can restrict later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------
# Router Registration
# --------------------------
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(projects_router)
app.include_router(conversations_router)
app.include_router(conversations_list_router)
app.include_router(summaries_router)
app.include_router(resume_router)
app.include_router(memory_router)
