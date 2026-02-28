from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import aiosqlite
import os
from mistralai import Mistral

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

@app.post("/api/story", response_model=Story)
async def create_story_with_agent(prompt: dict):
    # Extract inputs from prompt
    child_name = prompt.get("child_name", "")
    language = prompt.get("language", "en")
    story_prompt = prompt.get("prompt", "")
    
    # Get API key from environment
    api_key = os.environ.get("MISTRAL_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="MISTRAL_API_KEY environment variable not set")
    
    # Initialize Mistral client
    client = Mistral(api_key=api_key)
    
    try:
        # Call Mistral agent to generate story
        response = client.beta.conversations.start(
            agent_id='ag_019ca24f110677d7a92ec83a5c85704a',
            inputs={
                "child_name": child_name,
                "language": language,
                "prompt": story_prompt
            }
        )
        
        # Parse response
        if not response.outputs or not response.outputs[0].content:
            raise HTTPException(status_code=500, detail="No response from agent")
        
        story_content = response.outputs[0].content
        
        # Save to database
        async with await get_db() as db:
            cursor = await db.execute(
                "INSERT INTO stories (title, content, voice_id) VALUES (?, ?, ?)",
                (f"Story for {child_name}", story_content, None)
            )
            await db.commit()
            story_id = cursor.lastrowid
        
        return {
            "id": story_id,
            "title": f"Story for {child_name}",
            "content": story_content,
            "voice_id": None
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating story: {str(e)}")


@app.post("/api/narrate")
async def narrate_scene_endpoint(scene: dict):
    """
    Narrate a scene text in a given language using ElevenLabs API.
    Returns MP3 audio bytes.
    
    Args:
        scene (dict): {
            "text": str,
            "language": str (optional, defaults to "en")
        }
    
    Returns:
        StreamingResponse: MP3 audio file.
    """
    from utils import narrate_scene
    
    text = scene.get("text", "")
    language = scene.get("language", "en")
    
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")
    
    try:
        mp3_bytes = narrate_scene(text, language)
        return StreamingResponse(iter([mp3_bytes]), media_type="audio/mpeg")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error narrating scene: {str(e)}")

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
