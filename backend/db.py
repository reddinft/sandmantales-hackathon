import aiosqlite
import json
from datetime import datetime

DB_PATH = "./stories.db"

async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS stories (
                id TEXT PRIMARY KEY,
                child_name TEXT,
                language TEXT,
                prompt TEXT,
                title TEXT,
                scenes TEXT,
                created_at TEXT
            )
        """)
        await db.commit()

async def save_story(story_data: dict):
    async with aiosqlite.connect(DB_PATH) as db:
        story_data["created_at"] = datetime.utcnow().isoformat()
        await db.execute("""
            INSERT INTO stories (id, child_name, language, prompt, title, scenes, created_at)
            VALUES (:id, :child_name, :language, :prompt, :title, :scenes, :created_at)
        """, story_data)
        await db.commit()

async def get_story(story_id: str):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT * FROM stories WHERE id = ?", (story_id,))
        row = await cursor.fetchone()
        if row:
            return dict(row)
        return None

async def get_all_stories():
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT * FROM stories")
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]