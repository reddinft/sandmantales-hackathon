from fastapi import FastAPI, HTTPException
from starlette.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import aiosqlite
import os
import asyncio
import subprocess
import json
import traceback

app = FastAPI()

# Serve static files (illustrations)
from fastapi.staticfiles import StaticFiles
import os
_static_dir = os.path.join(os.path.dirname(__file__), "frontend", "public")
if os.path.exists(_static_dir):
    app.mount("/illustrations", StaticFiles(directory=os.path.join(_static_dir, "illustrations")), name="illustrations")

# CORS
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
DB_PATH = "stories.db"

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
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "INSERT INTO stories (title, content, voice_id) VALUES (?, ?, ?)",
            (story.title, story.content, story.voice_id)
        )
        await db.commit()
        story_id = cursor.lastrowid
        return {**story.dict(), "id": story_id}

async def call_pathfinder(prompt: str) -> str:
    proc = await asyncio.create_subprocess_exec(
        '/Users/loki/.pyenv/versions/3.14.3/bin/python3', 'team.py', 'pathfinder', prompt,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        env={**os.environ},
        cwd='/tmp/sandmantales-hackathon'
    )
    stdout, stderr = await proc.communicate()
    if proc.returncode != 0:
        raise Exception(f"team.py failed (rc={proc.returncode}): {stderr.decode()[:500]}")
    return stdout.decode()

@app.post("/api/story")
async def create_story_with_agent(prompt: dict):
    # Extract inputs from prompt
    child_name = prompt.get("child_name", "")
    language = prompt.get("language", "en")
    story_prompt = prompt.get("prompt", "")
    
    try:
        # Build prompt string
        prompt = f'Generate a bedtime story for {child_name} in {language}. Story idea: {story_prompt}. Return a JSON object with keys: title (string), scenes (array of objects with text, mood, illustration_prompt).'
        
        # Call team.py to generate story via subprocess
        response_text = await call_pathfinder(prompt)
        
        # Parse response text - everything before "---\nConversation ID:" is the content
        content_text = response_text.split('\n---\n')[0].strip()
        
        # Strip markdown code fences if present
        if content_text.startswith('```'):
            content_text = content_text.split('\n', 1)[1] if '\n' in content_text else content_text[3:]
            if content_text.endswith('```'):
                content_text = content_text[:-3].strip()
        
        if not content_text:
            raise HTTPException(status_code=500, detail="No valid story data in response")
        
        story_data = json.loads(content_text)
        
        title = story_data.get('title', f'Story for {child_name}')
        scenes = story_data.get('scenes', [])
        
        # Save to database
        async with aiosqlite.connect(DB_PATH) as db:
            cursor = await db.execute(
                "INSERT INTO stories (title, content, voice_id) VALUES (?, ?, ?)",
                (title, json.dumps({"scenes": scenes}), None)
            )
            await db.commit()
            story_id = cursor.lastrowid
        
        return {
            "id": story_id,
            "title": title,
            "content": {"scenes": scenes},
            "voice_id": None
        }
    
    except Exception as e:
        traceback.print_exc()
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
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "SELECT voice_id FROM stories WHERE id = ?", (id,)
        )
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Story not found")
        return {"message": f"Narrating story {id} with voice {row[0]}"}

@app.get("/api/stories", response_model=list[Story])
async def get_stories():
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("SELECT id, title, content, voice_id FROM stories")
        rows = await cursor.fetchall()
        return [{"id": row[0], "title": row[1], "content": row[2], "voice_id": row[3]} for row in rows]

@app.get("/api/stories/{id}", response_model=Story)
async def get_story(id: int):
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "SELECT id, title, content, voice_id FROM stories WHERE id = ?", (id,)
        )
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Story not found")
        return {"id": row[0], "title": row[1], "content": row[2], "voice_id": row[3]}
