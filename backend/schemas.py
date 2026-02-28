from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class StoryCreate(BaseModel):
    prompt: str

class StoryResponse(BaseModel):
    id: str
    prompt: str
    story_text: str
    voice_url: Optional[str] = None
    illustration_url: Optional[str] = None
    created_at: str

class StoryDB(StoryResponse):
    pass