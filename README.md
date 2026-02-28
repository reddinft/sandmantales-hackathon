# 🌙 Sandman Tales

**Multilingual AI bedtime story generator with voice narration**

Built for the [Mistral AI Hackathon](https://mistral.ai/hackathon) (Feb 28 – Mar 1, 2026) at UNSW Founders, Sydney.

**Team:** ClawCutters (solo entry by Nissan Dookeran, [@redditech](https://x.com/redditech))

## What it does

Parents tap a button, describe a bedtime story idea, and Sandman Tales:
1. **Generates** a structured 6-scene story via Mistral Agents API (Pathfinder agent)
2. **Illustrates** scenes with FLUX (local AI image generation)
3. **Narrates** the story in the child's language via ElevenLabs multilingual TTS

Supports English, Japanese, French, and Hindi.

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌───────────────┐
│  React App  │────▶│  FastAPI Backend  │────▶│  Pathfinder   │
│  (Vite)     │     │  (Python 3.12+)  │     │  (Mistral AI) │
└─────────────┘     └──────────────────┘     └───────────────┘
                           │                         │
                    ┌──────┴──────┐           ┌──────┴──────┐
                    │  ElevenLabs │           │  team.py    │
                    │  (TTS)      │           │  (Agents)   │
                    └─────────────┘           └─────────────┘
```

### Multi-Agent System (Mistral Agents API)

| Agent | Role | Mistral Agent ID |
|-------|------|-----------------|
| **Doc** | Orchestrator | `ag_019ca24ec2c2...` |
| **Pathfinder** | Story Generation | `ag_019ca24f1106...` |
| **Firefly** | Architecture/Build | `ag_019ca24f6017...` |
| **Lifeline** | Voice/Audio Research | `ag_019ca24f1478...` |

Agents communicate via `team.py` — a CLI tool built with Vibe CLI that calls the Mistral Conversations API.

**Real hackathon learning:** Our orchestrator (Doc) initially tried to do everything solo. We had to build `team.py` to make delegation *easier* than doing it yourself. That's the key insight: orchestration without frictionless delegation is just a fancy single agent.

## Tech Stack

- **Story Gen:** Mistral Agents API (`mistral-large-latest`)
- **Code Gen:** Vibe CLI (`devstral-2`)
- **Voice:** ElevenLabs (`eleven_multilingual_v2`)
- **Images:** FLUX schnell (local, via mflux on Apple Silicon)
- **Backend:** FastAPI + aiosqlite (Python 3.12+)
- **Frontend:** React + Vite + TypeScript + Tailwind CSS
- **DB:** SQLite (local-first, no cloud dependencies)

## Quick Start

### Local

```bash
# Clone
git clone https://github.com/reddinft/sandmantales-hackathon.git
cd sandmantales-hackathon

# Backend
pip install -r requirements.txt
export MISTRAL_API_KEY=your_key
export ELEVENLABS_API_KEY=your_key
python -m uvicorn main:app --port 8001

# Frontend
cd frontend
npm install
npm run dev
```

### Docker

```bash
export MISTRAL_API_KEY=your_key
export ELEVENLABS_API_KEY=your_key
docker-compose up --build
```

Visit `http://localhost:5173` (dev) or `http://localhost:8001` (production).

## Screens

1. **Story Creator** — Enter child's name, pick language, describe the story
2. **Story Player** — Scene-by-scene view with illustrations and "Listen" button
3. **Story Library** — Grid of all generated stories

## Prize Categories

- 🏆 **Sydney 1st Place** — Full working app with multi-agent architecture
- 🎙️ **Best ElevenLabs Usage** — Multilingual narration (EN/JA/FR/HI)
- 🤖 **Best Agent Skills** — 4-agent team with real delegation via Conversations API
- ⚡ **Best Vibe Usage** — All code scaffolded by Vibe CLI (`devstral-2`)
- 🧪 **Best Architectural Modification** — FunctionCallEntry handling, async subprocess bridge
- 🦄 **Next Unicorns** — Bedtime stories are a $2B market

## License

MIT
