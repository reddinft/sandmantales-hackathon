"""
Database abstraction layer — Turso (libsql) in production, aiosqlite for local dev.
"""
import os
import asyncio
from contextlib import asynccontextmanager

TURSO_URL = os.environ.get("TURSO_URL", "https://sandmantales-monkfenix.aws-ap-northeast-1.turso.io")
TURSO_AUTH_TOKEN = os.environ.get("TURSO_AUTH_TOKEN", "")

USE_TURSO = bool(TURSO_AUTH_TOKEN)

_turso_client = None

async def get_turso_client():
    global _turso_client
    if _turso_client is None:
        import libsql_client
        _turso_client = libsql_client.create_client(
            url=TURSO_URL,
            auth_token=TURSO_AUTH_TOKEN
        )
    return _turso_client

async def execute(sql: str, params=None):
    """Execute a SQL statement and return result."""
    if USE_TURSO:
        client = await get_turso_client()
        if params:
            rs = await client.execute(sql, params)
        else:
            rs = await client.execute(sql)
        return rs
    else:
        import aiosqlite
        async with aiosqlite.connect("stories.db") as db:
            if params:
                cursor = await db.execute(sql, params)
            else:
                cursor = await db.execute(sql)
            await db.commit()
            rows = await cursor.fetchall()
            # Return a simple object mimicking libsql result
            class Result:
                def __init__(self, rows, lastrowid):
                    self.rows = rows
                    self.last_insert_rowid = lastrowid
            return Result(rows, cursor.lastrowid)

async def init_db():
    """Create tables if they don't exist."""
    await execute("""
        CREATE TABLE IF NOT EXISTS stories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            voice_id TEXT,
            child_name TEXT,
            language TEXT DEFAULT 'en',
            user_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    await execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    await execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            token TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME
        )
    """)

async def close():
    global _turso_client
    if _turso_client:
        await _turso_client.close()
        _turso_client = None
