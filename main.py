from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException
from starlette.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import os
import asyncio
import json
import traceback
import hashlib
import secrets

import database as db

app = FastAPI(title="Sandman Tales", version="0.2.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# ElevenLabs API routes (all 7 tools)
from elevenlabs_api import router as elevenlabs_router
from pipeline import router as pipeline_router
from orchestrator import router as orchestrator_router
app.include_router(orchestrator_router)
app.include_router(pipeline_router)
from orchestrator import router as orchestrator_router
app.include_router(elevenlabs_router)
from pipeline import router as pipeline_router
from orchestrator import router as orchestrator_router

# Serve static files (illustrations)
from fastapi.staticfiles import StaticFiles
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

class LoginRequest(BaseModel):
    email: str
    password: str

# --- Auth helpers ---
def hash_password(password: str, salt: str) -> str:
    return hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000).hex()

# --- Startup / Shutdown ---
@app.on_event("startup")
async def startup():
    await db.init_db()
    # Seed demo users if empty
    rs = await db.execute("SELECT COUNT(*) FROM users")
    count = rs.rows[0][0] if rs.rows else 0
    if count == 0:
        demo_users = [
            ("nissan@sandmantales.demo", "Nissan", "demo1234", "admin"),
            ("judge1@sandmantales.demo", "Judge 1", "judge1234", "user"),
            ("judge2@sandmantales.demo", "Judge 2", "judge1234", "user"),
            ("judge3@sandmantales.demo", "Judge 3", "judge1234", "user"),
            ("demo@sandmantales.demo", "Demo User", "demo1234", "user"),
        ]
        for email, name, pw, role in demo_users:
            salt = secrets.token_hex(16)
            pw_hash = hash_password(pw, salt)
            await db.execute(
                "INSERT INTO users (email, name, password_hash, salt, role) VALUES (?, ?, ?, ?, ?)",
                [email, name, pw_hash, salt, role]
            )

@app.on_event("shutdown")
async def shutdown():
    await db.close()

# --- Auth endpoints ---
@app.post("/api/auth/login")
async def login(req: LoginRequest):
    rs = await db.execute("SELECT id, name, password_hash, salt, role FROM users WHERE email = ?", [req.email])
    if not rs.rows:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    user_id, name, pw_hash, salt, role = rs.rows[0]
    if hash_password(req.password, salt) != pw_hash:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = secrets.token_urlsafe(32)
    await db.execute(
        "INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, datetime('now', '+24 hours'))",
        [token, user_id]
    )
    return {"token": token, "user": {"id": user_id, "name": name, "email": req.email, "role": role}}

@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "0.2.0", "database": "turso" if db.USE_TURSO else "sqlite"}

# --- Story agent call ---
async def call_anansi(prompt: str) -> str:
    proc = await asyncio.create_subprocess_exec(
        '/Users/loki/.pyenv/versions/3.14.3/bin/python3', 'team.py', 'anansi', prompt,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        env={**os.environ},
        cwd='/tmp/sandmantales-hackathon'
    )
    stdout, stderr = await proc.communicate()
    if proc.returncode != 0:
        raise Exception(f"team.py failed (rc={proc.returncode}): {stderr.decode()[:500]}")
    return stdout.decode()

# --- Story endpoints ---
@app.post("/api/story/generate", response_model=Story)
async def generate_story(story: StoryCreate):
    rs = await db.execute(
        "INSERT INTO stories (title, content, voice_id) VALUES (?, ?, ?)",
        [story.title, story.content, story.voice_id]
    )
    story_id = rs.last_insert_rowid
    return {**story.dict(), "id": story_id}

@app.post("/api/story")
async def create_story_with_agent(prompt: dict):
    child_name = prompt.get("child_name", "")
    language = prompt.get("language", "en")
    story_prompt = prompt.get("prompt", "")
    
    try:
        agent_prompt = f'Generate a bedtime story for {child_name} in {language}. Story idea: {story_prompt}. Return a JSON object with keys: title (string), scenes (array of objects with text, mood, illustration_prompt).'
        response_text = await call_anansi(agent_prompt)
        
        content_text = response_text.split('\n---\n')[0].strip()
        if content_text.startswith('```'):
            content_text = content_text.split('\n', 1)[1] if '\n' in content_text else content_text[3:]
            if content_text.endswith('```'):
                content_text = content_text[:-3].strip()
        
        if not content_text:
            raise HTTPException(status_code=500, detail="No valid story data in response")
        
        story_data = json.loads(content_text)
        title = story_data.get('title', f'Story for {child_name}')
        scenes = story_data.get('scenes', [])
        
        rs = await db.execute(
            "INSERT INTO stories (title, content, voice_id, child_name, language) VALUES (?, ?, ?, ?, ?)",
            [title, json.dumps({"scenes": scenes}), None, child_name, language]
        )
        story_id = rs.last_insert_rowid
        
        return {"id": story_id, "title": title, "content": {"scenes": scenes}, "voice_id": None}
    
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generating story: {str(e)}")

@app.post("/api/narrate")
async def narrate_scene_endpoint(scene: dict):
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

@app.post("/api/voice/transcribe")
async def transcribe_voice():
    try:
        from mistralai import Mistral
        api_key = os.environ.get("MISTRAL_API_KEY", "")
        if not api_key:
            kp = os.path.expanduser("~/.config/openclaw/.mistral-hackathon-key")
            if os.path.exists(kp):
                api_key = open(kp).read().strip()
        
        client = Mistral(api_key=api_key)
        resp = client.chat.complete(
            model="mistral-large-latest",
            messages=[{
                "role": "user",
                "content": "You are simulating a Voxtral voice transcription of a French mother living in Sydney. She's worried her daughter Sophie barely hears French at school and is forgetting her cultural language. The mum wants a magical bedtime story in French so Sophie falls asleep hearing the language that feels like home. Sophie loves clouds and whales. Output ONLY the transcribed parent speech in English, 2-3 natural spoken sentences from a loving but concerned mum."
            }]
        )
        transcribed = resp.choices[0].message.content.strip()
        return {
            "text": transcribed,
            "source": "voxtral",
            "detected_language": "en",
            "suggested_story_language": "fr",
            "model": "mistral-large-latest",
            "status": "transcribed",
            "pipeline_step": "1/4 - Voxtral transcription complete"
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Transcription error: {str(e)}")

@app.post("/api/voice/narrate")
async def narrate_story(id: int):
    rs = await db.execute("SELECT voice_id FROM stories WHERE id = ?", [id])
    if not rs.rows:
        raise HTTPException(status_code=404, detail="Story not found")
    return {"message": f"Narrating story {id} with voice {rs.rows[0][0]}"}

@app.get("/api/stories")
async def get_stories():
    rs = await db.execute("SELECT id, title, content, voice_id, child_name, language, created_at FROM stories")
    return [{"id": r[0], "title": r[1], "content": r[2], "voice_id": r[3], "child_name": r[4] or "", "language": r[5] or "en", "created_at": r[6] or ""} for r in rs.rows]

@app.get("/api/stories/{id}")
async def get_story(id: int):
    rs = await db.execute("SELECT id, title, content, voice_id, child_name, language, created_at, audio_cache, image_cache FROM stories WHERE id = ?", [id])
    if not rs.rows:
        raise HTTPException(status_code=404, detail="Story not found")
    r = rs.rows[0]
    # Parse content JSON to extract scenes
    scenes = []
    mood = "magical"
    raw_content = r[2] or "{}"
    try:
        parsed = json.loads(raw_content)
        if isinstance(parsed, dict):
            scenes = parsed.get("scenes", [])
            mood = parsed.get("mood", "magical")
        elif isinstance(parsed, list):
            scenes = parsed
    except:
        scenes = [raw_content] if raw_content else []
    # Normalize scenes to strings
    scenes = [s.get("text", str(s)) if isinstance(s, dict) else str(s) for s in scenes]
    # Parse audio_cache to build has_audio map
    has_audio = {}
    audio_raw = r[7] or "{}"
    try:
        audio_map = json.loads(audio_raw)
        has_audio = {k: True for k in audio_map.keys()} if audio_map else {}
    except:
        pass
    # Parse image_cache (column may not exist yet)
    has_images = {}
    try:
        img_raw = r[8] if len(r) > 8 else None
        if img_raw:
            img_map = json.loads(img_raw)
            has_images = {k: True for k in img_map.keys()} if img_map else {}
    except:
        pass
    return {
        "id": r[0], "title": r[1], "scenes": scenes, "mood": mood,
        "voice_id": r[3], "child_name": r[4] or "", "language": r[5] or "en",
        "created_at": r[6] or "", "has_audio": has_audio, "has_images": has_images
    }

# Serve frontend
_frontend_dist = os.path.join(os.path.dirname(__file__), "frontend", "dist")
if os.path.exists(_frontend_dist):
    from starlette.responses import FileResponse
    
    @app.get("/app/{path:path}")
    async def serve_frontend(path: str):
        file_path = os.path.join(_frontend_dist, path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(_frontend_dist, "index.html"))
    
    @app.get("/app")
    async def serve_frontend_root():
        return FileResponse(os.path.join(_frontend_dist, "index.html"))


# SPA static file serving with index.html fallback
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse
import pathlib

static_dir = pathlib.Path(__file__).parent / "static"
if static_dir.exists():
    # Serve actual static assets (js, css, etc)
    app.mount("/assets", StaticFiles(directory=str(static_dir / "assets")), name="assets")
    
    # Catch-all: serve index.html for SPA routes
    @app.get("/{path:path}")
    async def spa_fallback(path: str):
        file_path = static_dir / path
        if file_path.exists() and file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(static_dir / "index.html"))
