# Demo Test Report — Sandman Tales v2
**Date:** 2026-03-01 13:42 AEST
**Live URL:** https://sandmantales-api-production.up.railway.app/

## Automated Smoke Test: 34/34 PASSED ✅

## Browser Walkthrough (7 steps recorded)

| Step | Screen | What Happened | Screenshot |
|------|--------|---------------|------------|
| 1 | **Login** | Starfield bg, agent roster footer, entered nissan@sandmantales.demo | 01_login.png |
| 2 | **Dashboard** | Two-panel: input left, pipeline viz right. All nodes idle (grey) | 02_dashboard.png |
| 3 | **Form Filled** | Sophie, Français, prompt typed. Confirm/Redo buttons appeared | 03_form_filled.png |
| 4 | **Pipeline Active** | Ogma→Cache→Papa Bois→Guardrail green. Anansi pulsing amber. Message: "Papa Bois → Anansi: Generating story via Mistral Agent..." | 04_pipeline_active.png |
| 5 | **Pipeline Complete** | ALL 9 nodes green. Green "▶️ Play" button. Title: "Sophie la Baleine et le Nuage Joueur" | 05_pipeline_done.png |
| 6 | **Library** | 8 stories shown (FR, EN, JA). Grid cards with child name + language | 06_library.png |
| 7 | **Story Player** | Pre-cached story loaded. ⚡Instant Audio badge. 3-layer controls (Narration 100%, SFX 30%, Lullaby 20%). Scene 1/5 in French. | 07_player.png |

## Video
- `demo_video/demo_walkthrough_v2.mp4` — 28s slideshow of all 7 steps

## Issues Found
- **None blocking demo.** All pages render, all endpoints respond, all cached audio plays.

## API Endpoints Verified
| Endpoint | Tool | Status |
|----------|------|--------|
| `GET /api/health` | Core | ✅ turso connected |
| `POST /api/auth/login` | Core | ✅ token returned |
| `GET /api/voices` | ElevenLabs Voices/Get | ✅ 22 voices |
| `POST /api/voice/tts` | ElevenLabs TTS | ✅ endpoint exists |
| `POST /api/voice/stt` | ElevenLabs STT | ✅ endpoint exists |
| `POST /api/audio/sfx` | ElevenLabs Sound Gen | ✅ endpoint exists |
| `POST /api/audio/lullaby` | ElevenLabs Music | ✅ endpoint exists |
| `WS /api/voice/stream` | ElevenLabs WS Stream | ✅ endpoint exists |
| `POST /api/story/chat` | ElevenAgents | ✅ Mistral responds |
| `POST /api/voice/transcribe` | Ogma Dual-STT | ✅ endpoint exists |
| `POST /api/orchestrate` | Papa Bois + Anansi | ✅ story generated |
| `GET /api/stories` | CRUD | ✅ 8 stories |
| `GET /api/stories/:id` | CRUD | ✅ with audio cache |
| `GET /api/stories/:id/audio/:key` | Audio Cache | ✅ 7 tracks served |
| `GET /api/agents` | Agent Roster | ✅ 6 agents listed |

## Cached Demo Story
- **ID 4:** "Les Baleines de Nuages et le Rêve de Sophie"
- **Audio tracks:** 5 narrations + 1 SFX + 1 lullaby = 7 total
- **Total cached size:** ~1.3MB in Turso base64
- **Playback:** Instant ⚡
