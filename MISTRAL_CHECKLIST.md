# Mistral Technology Checklist — Sandman Tales v2

_Reviewed by Doc (Papa Bois 🌳) — 2026-03-01_

## ✅ USED — Mistral Features in Our App

### 1. Agents API (Beta) ✅
- **4 agents created** with unique IDs, names, instructions, models
- Papa Bois `ag_019ca24ec2c271458172692e54fc0c94` — orchestrator
- Anansi `ag_019ca24f110677d7a92ec83a5c85704a` — story generator
- Devi `ag_019ca24f147876f2ab26526f6cf8c4b4` — voice/audio lead
- Firefly `ag_019ca24f601773e1a953fac560ff4d71` — assembler
- **Where:** `orchestrator.py` lines 17-22

### 2. Conversations API (Beta) ✅
- `client.beta.conversations.start()` — new conversations with agent_id
- `client.beta.conversations.append()` — continue existing conversations
- Conversation IDs tracked and returned to frontend
- **Where:** `orchestrator.py` lines 50-60, 125-155

### 3. Chat Completion API ✅
- `client.chat.complete()` — direct LLM calls for story generation
- Used with `mistral-large-latest` model
- JSON mode via `response_format={"type": "json_object"}`
- **Where:** `pipeline.py` lines 127-133, `main.py` line 202

### 4. Mistral Large (Model) ✅
- Primary model for story generation + orchestration
- `mistral-large-latest` used in both chat completion and agent creation
- **Where:** `pipeline.py` line 128, `orchestrator.py`

### 5. Voxtral (Speech-to-Text) ✅
- Dual-STT pipeline: ElevenLabs Scribe + Voxtral consensus
- Voxtral processes audio transcription for language detection
- **Where:** `pipeline.py` lines 54-78 (Ogma agent)

### 6. Vibe CLI ✅
- **31 Vibe sessions** logged at `~/.vibe/logs/session/`
- Used for scaffolding, code generation, and iterative development
- `.vibe/instructions.md` — project instructions file
- **Evidence:** Session logs, `.vibeignore`, instructions file

### 7. JSON Mode / Structured Output ✅
- `response_format={"type": "json_object"}` for story generation
- Ensures parseable `{title, scenes, mood}` output
- **Where:** `pipeline.py` line 133

### 8. System Prompts / Instructions ✅
- Each agent has custom instructions defining role and behaviour
- Papa Bois: Trinidad French Creole orchestrator personality
- Anansi: Storyteller with cultural sensitivity guardrails
- **Where:** Agent creation on Mistral platform + `orchestrator.py`

---

## ❌ NOT USED — Mistral Features We Could Add

### 9. Handoffs ❌ — 🔴 HIGH PRIORITY
- **What:** Agent-to-agent delegation within Conversations API
- **Docs:** https://docs.mistral.ai/agents/handoffs
- Papa Bois → Anansi delegation currently done app-side (two separate `conversations.start()` calls)
- **To fix:** Create Papa Bois with `handoffs=[anansi_agent_id]`, let Mistral handle the delegation server-side
- **Impact:** HIGH — this is the flagship multi-agent feature, judges will look for it
- **Effort:** ~30 min

### 10. Function Calling (Custom Tools) ❌ — 🔴 HIGH PRIORITY
- **What:** Define custom functions agents can call
- **Docs:** https://docs.mistral.ai/capabilities/function_calling
- Could define `generate_tts()`, `generate_sfx()`, `check_content_safety()` as tools Papa Bois calls
- **Impact:** HIGH — shows deep integration between Mistral agents and ElevenLabs
- **Effort:** ~45 min

### 11. Built-in Web Search Tool ❌ — 🟡 MEDIUM
- **What:** `web_search` or `web_search_premium` as agent tool
- Could add to Papa Bois for looking up cultural context or lullaby traditions
- **Impact:** MEDIUM — shows tool diversity
- **Effort:** ~15 min (just add `tools=[{"type": "web_search"}]` to agent)

### 12. Built-in Image Generation ❌ — 🟡 MEDIUM
- **What:** `image_generation` as agent tool
- Could use for story illustrations (currently stretch goal, we use Gemini instead)
- **Impact:** MEDIUM — would replace our external image gen
- **Effort:** ~20 min

### 13. Built-in Document Library / RAG ❌
- Could upload cultural stories/lullabies as reference corpus
- **Impact:** MEDIUM — shows RAG capability
- **Effort:** ~30 min

### 14. Streaming (Chat Completion) ❌
- `stream=True` for progressive token delivery
- Could stream story text as it generates
- **Impact:** MEDIUM — better UX
- **Effort:** ~20 min

### 15. Built-in Code Interpreter ❌
- Not relevant to bedtime stories
- **Impact:** LOW

### 16. Magistral (Reasoning Models) ❌
- Overkill for bedtime stories
- **Impact:** LOW

### 17. Devstral / Codestral ❌
- Code-specific models, not relevant
- **Impact:** NONE

---

## 🎯 PRIORITY RECOMMENDATIONS (3h to deadline)

| Priority | Feature | Time | Impact | Judges Care? |
|----------|---------|------|--------|--------------|
| **P0** | **Handoffs** (Papa Bois → Anansi server-side) | 30 min | 🔴 HIGH | YES — flagship |
| **P1** | **Function Calling** (ElevenLabs as Mistral tools) | 45 min | 🔴 HIGH | YES — deep integration |
| **P2** | **Web Search** tool on Papa Bois | 15 min | 🟡 MEDIUM | Nice to have |
| **P3** | **Streaming** story generation | 20 min | 🟡 MEDIUM | UX polish |

## Current Score: 8/17 Mistral features used
## With P0+P1: 10/17 — strong showcase
## With P0+P1+P2: 11/17 — excellent

---

## Summary Scorecard

| Feature | Status | Evidence |
|---------|--------|----------|
| Agents API | ✅ | 4 agents, orchestrator.py |
| Conversations API | ✅ | start/append, conversation_id |
| Chat Completion | ✅ | pipeline.py, main.py |
| Mistral Large | ✅ | mistral-large-latest |
| Voxtral STT | ✅ | pipeline.py dual-STT |
| Vibe CLI | ✅ | 31 sessions logged |
| JSON Mode | ✅ | response_format |
| System Prompts | ✅ | Agent instructions |
| **Handoffs** | **❌** | App-side only |
| **Function Calling** | **❌** | Tools are app-side |
| **Web Search** | **❌** | Not used |
| Code Interpreter | ❌ | Not relevant |
| Image Generation | ❌ | Using Gemini |
| Document Library | ❌ | Not used |
| Streaming | ❌ | Not used |
| Citations | ❌ | Not used |
| Magistral | ❌ | Not used |
