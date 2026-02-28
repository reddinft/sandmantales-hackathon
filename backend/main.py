"""Sandman Tales v2 — Hackathon Backend
Local FastAPI server powered by Mistral + ElevenLabs.
"""
import os
import json
import time
import uuid
import aiosqlite
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from mistralai import Mistral

# --- Config ---
MISTRAL_API_KEY = os.environ.get("MISTRAL_API_KEY", "")
ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY", "")
DB_PATH = Path(__file__).parent / "stories.db"
AUDIO_DIR = Path(__file__).parent / "audio"
AUDIO_DIR.mkdir(exist_ok=True)

# --- Database ---
async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS stories (
                id TEXT PRIMARY KEY,
                child_name TEXT NOT NULL,
                language TEXT DEFAULT 'en',
                title TEXT,
                story_json TEXT,
                audio_path TEXT,
                image_paths TEXT,
                created_at REAL DEFAULT (unixepoch())
            )
        """)
        await db.commit()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

# --- App ---
app = FastAPI(title="Sandman Tales v2", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # hackathon mode
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve generated audio files
app.mount("/audio", StaticFiles(directory=str(AUDIO_DIR)), name="audio")

# --- Mistral client ---
client = Mistral(api_key=MISTRAL_API_KEY)

# --- Models ---
class StoryRequest(BaseModel):
    child_name: str
    age: int = 5
    language: str = "en"
    what_happened_today: str = ""
    mood: str = "gentle wonder"
    pet_name: str | None = None
    pet_type: str | None = None

class StoryResponse(BaseModel):
    id: str
    title: str
    scenes: list[dict]
    language: str
    child_name: str
    moral: str | None = None

# --- Language config ---
LANGUAGE_NAMES = {
    "en": "English", "es": "Spanish", "pt": "Portuguese", "fr": "French",
    "th": "Thai", "vi": "Vietnamese", "ms": "Malay", "zh": "Mandarin Chinese",
    "id": "Indonesian", "ja": "Japanese", "ko": "Korean", "hi": "Hindi",
    "ur": "Urdu", "ar": "Arabic", "bn": "Bengali",
}

# ElevenLabs voice map (from existing sandmantales config)
VOICE_MAP = {
    "en": {"voice_id": "pFZP5JQG7iQjIQuC4Bku", "model": "eleven_multilingual_v2"},
    "es": {"voice_id": "cgSgspJ2msm6clMCkdW9", "model": "eleven_multilingual_v2"},
    "fr": {"voice_id": "EXAVITQu4vr4xnSDxMaL", "model": "eleven_multilingual_v2"},
    "zh": {"voice_id": "Xb7hH8MSUJpSbSDYk0k2", "model": "eleven_multilingual_v2"},
    "ja": {"voice_id": "XrExE9yKIg1WjnnlVkGX", "model": "eleven_multilingual_v2"},
    "hi": {"voice_id": "nPczCjzI2devNBz1zQrb", "model": "eleven_multilingual_v2"},
    "ar": {"voice_id": "onwK4e9ZLuTAKqWW03F9", "model": "eleven_multilingual_v2"},
}

# --- Story generation tool (Mistral function calling) ---
STORY_TOOL = {
    "type": "function",
    "function": {
        "name": "create_bedtime_story",
        "description": "Create a personalised bedtime story with scenes for illustration and narration",
        "parameters": {
            "type": "object",
            "required": ["title", "scenes"],
            "properties": {
                "title": {"type": "string", "description": "Story title"},
                "moral": {"type": "string", "description": "Gentle moral or lesson"},
                "scenes": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "required": ["text", "illustration_prompt", "mood"],
                        "properties": {
                            "text": {"type": "string", "description": "Story text for this scene (2-4 paragraphs)"},
                            "illustration_prompt": {"type": "string", "description": "Description for generating an illustration of this scene"},
                            "mood": {"type": "string", "enum": ["adventurous", "curious", "warm", "calm", "dreamy", "sleepy"]},
                            "sound_cue": {"type": "string", "description": "Optional ambient sound for this scene"},
                        }
                    },
                    "minItems": 4,
                    "maxItems": 7,
                }
            }
        }
    }
}


def get_system_prompt(language: str, age: int) -> str:
    lang_name = LANGUAGE_NAMES.get(language, "English")
    return f"""You are Sandman, a magical bedtime storyteller. You create personalised bedtime stories
for children that help them drift off to sleep.

Rules:
- The story MUST be written natively in {lang_name} (not translated)
- Target age: {age} years old — adjust vocabulary and themes accordingly
- Story arc: exciting adventure → resolution → calm → sleepy
- 4-6 scenes, each with illustration prompts
- Mood progression: adventurous/curious → warm → calm → dreamy → sleepy
- The child is always the hero
- End with the child falling asleep in a safe, warm place
- Include sensory details (soft blankets, warm light, gentle sounds)
- NO scary elements, violence, or anything that might cause anxiety

Use the create_bedtime_story tool to structure your response."""


@app.post("/api/story/generate", response_model=StoryResponse)
async def generate_story(req: StoryRequest):
    """Generate a personalised bedtime story using Mistral Large 3."""
    lang_name = LANGUAGE_NAMES.get(req.language, "English")

    user_prompt = f"""Create a bedtime story for {req.child_name}, age {req.age}.

Language: {lang_name}
"""
    if req.what_happened_today:
        user_prompt += f"\nWhat happened today: {req.what_happened_today}\nTransform these real events into a magical adventure."
    if req.pet_name:
        user_prompt += f"\nTheir pet {req.pet_type or 'companion'} named {req.pet_name} should be in the story."
    user_prompt += f"\nMood: {req.mood}"

    # Use Mistral Agents API with Pathfinder + function calling
    PATHFINDER_AGENT_ID = "ag_019ca24f110677d7a92ec83a5c85704a"
    
    try:
        # Start a conversation with Pathfinder for tracking
        conv = client.beta.conversations.start(
            agent_id=PATHFINDER_AGENT_ID,
            inputs=f"Generate a bedtime story: {user_prompt}",
        )
        conversation_id = conv.conversation_id
        
        # Use function calling via chat.complete for reliable structured output
        response = client.chat.complete(
            model="mistral-large-latest",
            messages=[
                {"role": "system", "content": get_system_prompt(req.language, req.age)},
                {"role": "user", "content": user_prompt},
            ],
            tools=[STORY_TOOL],
            tool_choice="any",
            temperature=0.8,
        )
        
        tool_call = None
        if response.choices and response.choices[0].message.tool_calls:
            tool_call = response.choices[0].message.tool_calls[0]
        
        if not tool_call:
            raise HTTPException(status_code=500, detail="Mistral didn't return a structured story")
        
        story_data = json.loads(tool_call.function.arguments)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Mistral API error: {e}")

        story_id = str(uuid.uuid4())[:8]

    # Save to SQLite
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO stories (id, child_name, language, title, story_json) VALUES (?, ?, ?, ?, ?)",
            (story_id, req.child_name, req.language, story_data.get("title", "Untitled"), json.dumps(story_data))
        )
        await db.commit()

    return StoryResponse(
        id=story_id,
        title=story_data.get("title", "Untitled"),
        scenes=story_data.get("scenes", []),
        language=req.language,
        child_name=req.child_name,
        moral=story_data.get("moral"),
    )


@app.post("/api/voice/transcribe")
async def transcribe_audio(audio: UploadFile = File(...), language: str = Form("en")):
    """Transcribe parent's voice input using Voxtral."""
    import httpx

    audio_bytes = await audio.read()

    async with httpx.AsyncClient() as http:
        resp = await http.post(
            "https://api.mistral.ai/v1/audio/transcriptions",
            headers={"Authorization": f"Bearer {MISTRAL_API_KEY}"},
            files={"file": (audio.filename or "audio.webm", audio_bytes, audio.content_type or "audio/webm")},
            data={"model": "voxtral-mini-latest", "language": language},
            timeout=30.0,
        )

    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Voxtral error: {resp.text}")

    return resp.json()


@app.post("/api/voice/narrate")
async def narrate_story(story_id: str = Form(...), scene_index: int = Form(0)):
    """Narrate a story scene using ElevenLabs."""
    import httpx

    # Get story from DB
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT * FROM stories WHERE id = ?", (story_id,))
        row = await cursor.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Story not found")

    story_data = json.loads(row["story_json"])
    scenes = story_data.get("scenes", [])
    if scene_index >= len(scenes):
        raise HTTPException(status_code=400, detail="Scene index out of range")

    scene_text = scenes[scene_index]["text"]
    language = row["language"]
    voice_config = VOICE_MAP.get(language, VOICE_MAP["en"])

    async with httpx.AsyncClient() as http:
        resp = await http.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{voice_config['voice_id']}",
            headers={
                "xi-api-key": ELEVENLABS_API_KEY,
                "Content-Type": "application/json",
            },
            json={
                "text": scene_text,
                "model_id": voice_config["model"],
                "voice_settings": {"stability": 0.6, "similarity_boost": 0.8},
            },
            timeout=60.0,
        )

    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail=f"ElevenLabs error: {resp.text}")

    # Save audio
    audio_file = AUDIO_DIR / f"{story_id}_scene{scene_index}.mp3"
    audio_file.write_bytes(resp.content)

    return {"audio_url": f"/audio/{story_id}_scene{scene_index}.mp3", "scene_index": scene_index}


@app.get("/api/stories")
async def list_stories():
    """List all generated stories."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT id, child_name, language, title, created_at FROM stories ORDER BY created_at DESC LIMIT 50")
        rows = await cursor.fetchall()

    stories = []
    for r in rows:
        s = dict(r)
        s["scenes"] = []  # List view doesn't need full scenes
        stories.append(s)
    return stories


@app.get("/api/stories/{story_id}")
async def get_story(story_id: str):
    """Get a single story with full data."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT * FROM stories WHERE id = ?", (story_id,))
        row = await cursor.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Story not found")

    story = dict(row)
    story_data = json.loads(story["story_json"])
    story["scenes"] = story_data.get("scenes", [])
    story["prompt"] = story_data.get("prompt", "")
    del story["story_json"]
    return story


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "version": "hackathon-v2",
        "mistral": bool(MISTRAL_API_KEY),
        "elevenlabs": bool(ELEVENLABS_API_KEY),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
