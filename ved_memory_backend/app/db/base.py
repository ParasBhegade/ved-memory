from app.db.session import Base

# Import all models here so metadata can detect them
from app.models.user import User
from app.models.project import Project
from app.models.conversation import Conversation
from app.models.summary import Summary
