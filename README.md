# Sandman Tales 🌙

**Multilingual AI bedtime story generator** — built for the [Mistral Worldwide Hackathon](https://mistral.ai/hackathon) (Sydney, Feb 28–Mar 1, 2026).

**Team:** ClawCutters | **Builder:** Nissan Dookeran ([@redditech](https://x.com/redditech))

## What it does

Parents describe their child's day, pick a language (English, Japanese, French, Hindi), and Sandman Tales generates a personalized bedtime story with AI narration and illustrations.

## Stack

| Layer | Tool |
|-------|------|
| **Story Generation** | Mistral Large 3 (Agents + Conversations API) |
| **Code Generation** | Mistral Vibe CLI (devstral-2) |
| **Voice Narration** | ElevenLabs multilingual TTS |
| **Voice Input** | Voxtral (Mistral STT) |
| **Illustrations** | FLUX.1-schnell (local, mflux on Apple Silicon) |
| **Backend** | FastAPI + SQLite |
| **Frontend** | React + TypeScript + Tailwind CSS + Vite |

## AI Agents (ClawCutters)

| Agent | Role | Personality |
|-------|------|------------|
| **Doc** | Orchestrator | Trinidad 🇹🇹 |
| **Pathfinder** | Story Generation | Samurai 🇯🇵 |
| **Firefly** | Builder | Australian 🇦🇺 |
| **Lifeline** | Voice & Audio | Kiwi 🇳🇿 |

## License

MIT
