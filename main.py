from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import aiosqlite
import os

app = FastAPI()

# Database setup
async def get_db():
    return await aiosqlite.connect("stories.db")

# Pydantic models
class StoryBase(BaseModel):
    title: str
    content: str
    voice_id: Optional[str] = None

class StoryCreate(StoryBase):
    pass

class StoryUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    voice_id: Optional[str] = None

class Story(StoryBase):
    id: int

# Initialize database
async def init_db():
    async with aiosqlite.connect("stories.db") as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS stories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                voice_id TEXT
            )
        """)
        await db.commit()

@app.on_event("startup")
async def startup():
    await init_db()

# Endpoints
@app.post("/api/story/generate", response_model=Story)
async def generate_story(story: StoryCreate):
    async with await get_db() as db:
        cursor = await db.execute(
            "INSERT INTO stories (title, content, voice_id) VALUES (?, ?, ?)",
            (story.title, story.content, story.voice_id)
        )
        await db.commit()
        story_id = cursor.lastrowid
        return {**story.dict(), "id": story_id}

@app.post("/api/voice/narrate")
async def narrate_story(id: int):
    async with await get_db() as db:
        cursor = await db.execute(
            "SELECT voice_id FROM stories WHERE id = ?", (id,)
        )
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Story not found")
        return {"message": f"Narrating story {id} with voice {row[0]}"}

@app.get("/api/stories", response_model=list[Story])
async def get_stories():
    async with await get_db() as db:
        cursor = await db.execute("SELECT id, title, content, voice_id FROM stories")
        rows = await cursor.fetchall()
        return [{"id": row[0], "title": row[1], "content": row[2], "voice_id": row[3]} for row in rows]

@app.get("/api/stories/{id}", response_model=Story)
async def get_story(id: int):
    async with await get_db() as db:
        cursor = await db.execute(
            "SELECT id, title, content, voice_id FROM stories WHERE id = ?", (id,)
        )
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Story not found")
        return {"id": row[0], "title": row[1], "content": row[2], "voice_id": row[3]}
