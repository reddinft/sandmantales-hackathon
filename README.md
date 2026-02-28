# Sandman Tales 🌙

**Multilingual AI bedtime story generator** — built for the [Mistral Worldwide Hackathon](https://mistral.ai/hackathon) (Sydney, Feb 28–Mar 1, 2026).

**Team:** ClawCutters | **Builder:** Nissan Dookeran ([@redditech](https://x.com/redditech))

## What it does

Parents pick a language (English, Japanese, French, Hindi), describe their child's day, and Sandman Tales generates a personalized bedtime story with AI-narrated audio and locally-generated illustrations.

## Architecture

- **Story Generation:** Mistral Large 3 via Agents + Conversations API
- **Voice Narration:** ElevenLabs multilingual TTS
- **Voice Input:** Voxtral (Mistral STT)
- **Illustrations:** FLUX.1-schnell (local, via mflux on Apple Silicon)
- **Backend:** FastAPI + SQLite + aiosqlite
- **Frontend:** React + TypeScript + Tailwind CSS + Vite
- **Code Generation:** Mistral Vibe CLI (devstral-2)

## AI Agents (ClawCutters)

| Agent | Role | Personality |
|-------|------|------------|
| **Doc** | Orchestrator | Trinidad 🇹🇹 |
| **Pathfinder** | Story Generation | Samurai 🇯🇵 |
| **Firefly** | Builder | Australian 🇦🇺 |
| **Lifeline** | Voice & Audio | Kiwi 🇳🇿 |

All agents powered by Mistral Agents API with unique personalities and conversation tracking.

## Quick Start

```bash
# Backend
cd backend
pip install -r requirements.txt
MISTRAL_API_KEY=xxx ELEVENLABS_API_KEY=xxx uvicorn main:app --port 8001

# Frontend
npm install
npm run dev
```

## Prizes Targeted

- 🏆 Sydney 1st Place
- 🎙️ Best Use of ElevenLabs
- 🤖 Best Use of Agent Skills
- 🔧 Best Vibe Usage
- 🧪 Best Architectural Modification (W&B)

## License

MIT
