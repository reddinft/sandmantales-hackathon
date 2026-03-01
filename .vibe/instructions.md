# Sandman Tales v2 — Hackathon Build Plan

## CURRENT STATE (updated 12:14 PM AEST Mar 1)
- ✅ database.py — Turso abstraction (cloud prod, SQLite fallback)
- ✅ main.py — rewritten with auth, Turso, agent renames
- ✅ team.py — agents renamed (anansi, devi, papa_bois, ogma, firefly)
- ✅ 5 demo users seeded in Turso cloud
- ✅ /api/health, /api/auth/login, /api/stories endpoints working
- ⏳ ElevenLabs endpoints NOT YET BUILT
- ⏳ Frontend needs Login page + updates

## Deadline: March 1, 2026 7:00 PM AEST (~5 hours)

## ElevenLabs API Key
- Environment variable: ELEVENLABS_API_KEY
- Must showcase ALL 7 ElevenLabs tools in the app

## 7 ElevenLabs Tools to Wire
1. **Voices/Get** — GET /api/voices → proxy to ElevenLabs GET /v1/voices
2. **TTS** — POST /api/voice/tts → ElevenLabs POST /v1/text-to-speech/{voice_id}
3. **TTS WebSocket** — WS /api/voice/stream → ElevenLabs wss://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream-input
4. **STT** — POST /api/voice/stt → ElevenLabs POST /v1/speech-to-text
5. **Sound Effects** — POST /api/audio/sfx → ElevenLabs POST /v1/sound-generation
6. **Music Compose** — POST /api/audio/lullaby → ElevenLabs POST /v1/music/generate (or text-to-sound-effects with musical prompt)
7. **ElevenAgents** — POST /api/story/chat → ElevenLabs Conversational AI agent

## Backend Stack
- FastAPI on :8001
- Python 3.14 at /Users/loki/.pyenv/versions/3.14.3/bin/python3
- httpx for async HTTP calls
- websockets for WebSocket proxy

## File Layout
- main.py — FastAPI app (routes + startup)
- database.py — Turso/SQLite abstraction
- team.py — Mistral agent CLI
- utils.py — narration helper (exists, uses elevenlabs SDK)
- config.py — existing config
- requirements.txt — deps

## Mistral Agents
| Agent | ID | Role |
|---|---|---|
| Papa Bois 🌳 | ag_019ca24ec2c271458172692e54fc0c94 | Orchestrator |
| Anansi 🕷️ | ag_019ca24f110677d7a92ec83a5c85704a | Storyteller |
| Firefly 🦆 | ag_019ca24f601773e1a953fac560ff4d71 | Builder |
| Devi 🙏 | ag_019ca24f147876f2ab26526f6cf8c4b4 | Voice/Audio |
| Ogma 🗣️ | null | Language Guardian |
