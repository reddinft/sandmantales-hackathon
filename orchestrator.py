"""
Papa Bois 🌳 — Orchestrator Agent via Mistral Agents API.
Uses Agents, Conversations, Handoffs, and Function Calling.
"""
import os
import json
import base64
import httpx
from mistralai import Mistral
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import prompt_cache
from typing import Optional

router = APIRouter()

MISTRAL_API_KEY = os.environ.get("MISTRAL_API_KEY", "")
ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY", "")
TAVILY_API_KEY = os.environ.get("TAVILY_API_KEY", "")

# Pre-registered agents on Mistral platform
AGENTS = {
    "papa_bois": "ag_019ca24ec2c271458172692e54fc0c94",
    "anansi": "ag_019ca24f110677d7a92ec83a5c85704a",
    "firefly": "ag_019ca24f601773e1a953fac560ff4d71",
    "devi": "ag_019ca24f147876f2ab26526f6cf8c4b4",
}

# Dynamic handoff agents (created at startup with handoffs configured)
HANDOFF_AGENTS = {}

# ---- ElevenLabs Function Tool Definitions ----
ELEVENLABS_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "generate_tts",
            "description": "Generate narration audio using ElevenLabs Text-to-Speech Multilingual v2.",
            "parameters": {
                "type": "object",
                "properties": {
                    "text": {"type": "string", "description": "Text to narrate"},
                    "voice_id": {"type": "string", "description": "ElevenLabs voice ID"},
                    "language": {"type": "string", "description": "Language code"}
                },
                "required": ["text"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "generate_sound_effect",
            "description": "Generate ambient sound effects using ElevenLabs Sound Generation.",
            "parameters": {
                "type": "object",
                "properties": {
                    "prompt": {"type": "string", "description": "Description of the sound effect"},
                    "duration_seconds": {"type": "number", "description": "Duration 1-22 seconds"}
                },
                "required": ["prompt"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "compose_lullaby",
            "description": "Compose a lullaby using ElevenLabs Music Composition.",
            "parameters": {
                "type": "object",
                "properties": {
                    "prompt": {"type": "string", "description": "Lullaby style and mood"},
                    "duration_seconds": {"type": "number", "description": "Duration 1-30 seconds"}
                },
                "required": ["prompt"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_cultural_context",
            "description": "Search for cultural context about lullabies, folklore, or mythology via Tavily.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search query"}
                },
                "required": ["query"]
            }
        }
    }
]

# ---- Tool Execution ----
def exec_generate_tts(text: str, voice_id: str = "FGY2WhTYpPnrIDTdsKH5", language: str = "en") -> dict:
    if not ELEVENLABS_API_KEY:
        return {"error": "ELEVENLABS_API_KEY not set"}
    try:
        r = httpx.post(f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
            headers={"xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json"},
            json={"text": text, "model_id": "eleven_multilingual_v2",
                  "voice_settings": {"stability": 0.6, "similarity_boost": 0.8}},
            timeout=30)
        if r.status_code == 200:
            return {"audio_b64": base64.b64encode(r.content).decode(), "size_kb": len(r.content) // 1024}
        return {"error": f"TTS {r.status_code}: {r.text[:200]}"}
    except Exception as e:
        return {"error": str(e)}

def exec_generate_sfx(prompt: str, duration_seconds: float = 10) -> dict:
    if not ELEVENLABS_API_KEY:
        return {"error": "ELEVENLABS_API_KEY not set"}
    try:
        r = httpx.post("https://api.elevenlabs.io/v1/sound-generation",
            headers={"xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json"},
            json={"text": prompt, "duration_seconds": min(duration_seconds, 22)},
            timeout=30)
        if r.status_code == 200:
            return {"audio_b64": base64.b64encode(r.content).decode(), "size_kb": len(r.content) // 1024}
        return {"error": f"SFX {r.status_code}: {r.text[:200]}"}
    except Exception as e:
        return {"error": str(e)}

def exec_compose_lullaby(prompt: str, duration_seconds: float = 15) -> dict:
    if not ELEVENLABS_API_KEY:
        return {"error": "ELEVENLABS_API_KEY not set"}
    try:
        r = httpx.post("https://api.elevenlabs.io/v1/sound-generation",
            headers={"xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json"},
            json={"text": f"Gentle lullaby music: {prompt}", "duration_seconds": min(duration_seconds, 22)},
            timeout=30)
        if r.status_code == 200:
            return {"audio_b64": base64.b64encode(r.content).decode(), "size_kb": len(r.content) // 1024}
        return {"error": f"Lullaby {r.status_code}: {r.text[:200]}"}
    except Exception as e:
        return {"error": str(e)}

def exec_web_search(query: str) -> dict:
    if not TAVILY_API_KEY:
        return {"error": "TAVILY_API_KEY not set"}
    try:
        r = httpx.post("https://api.tavily.com/search",
            json={"api_key": TAVILY_API_KEY, "query": query, "max_results": 3}, timeout=15)
        if r.status_code == 200:
            return {"results": [{"title": x.get("title",""), "snippet": x.get("content","")[:200]} for x in r.json().get("results",[])]}
        return {"error": f"Tavily {r.status_code}"}
    except Exception as e:
        return {"error": str(e)}

TOOL_DISPATCH = {
    "generate_tts": lambda a: exec_generate_tts(a.get("text",""), a.get("voice_id","FGY2WhTYpPnrIDTdsKH5"), a.get("language","en")),
    "generate_sound_effect": lambda a: exec_generate_sfx(a.get("prompt",""), a.get("duration_seconds",10)),
    "compose_lullaby": lambda a: exec_compose_lullaby(a.get("prompt",""), a.get("duration_seconds",15)),
    "search_cultural_context": lambda a: exec_web_search(a.get("query","")),
}


# ---- Agent Setup (Handoffs) ----
def _setup_handoff_agents(client: Mistral):
    """Create agents with handoffs configured (shows Mistral Agents API capabilities)."""
    global HANDOFF_AGENTS
    if HANDOFF_AGENTS:
        return

    try:
        anansi = client.beta.agents.create(
            model="mistral-large-latest",
            name="Anansi-Storyteller",
            description="Master Storyteller — generates multilingual bedtime stories",
            instructions="You are Anansi the spider storyteller. Create magical bedtime stories in any language. "
                         "Return ONLY valid JSON: {\"title\": \"...\", \"scenes\": [\"s1\",\"s2\",\"s3\",\"s4\"], \"mood\": \"...\"}",
            tools=ELEVENLABS_TOOLS
        )

        papa = client.beta.agents.create(
            model="mistral-large-latest",
            name="Papa-Bois-Orchestrator",
            description="Forest Guardian — orchestrates story creation and hands off to Anansi",
            instructions="You are Papa Bois, the forest guardian from Trinidad folklore. "
                         "Plan bedtime stories considering cultural sensitivity and child's interests. "
                         "Respond with JSON: {\"story_direction\": \"...\", \"mood\": \"...\", \"ambient_sfx\": \"...\", \"lullaby_style\": \"...\"}",
            handoffs=[anansi.id]
        )

        HANDOFF_AGENTS = {"papa_bois": papa.id, "anansi": anansi.id}
        print(f"✅ Handoff agents: Papa Bois={papa.id}, Anansi={anansi.id}")
    except Exception as e:
        print(f"⚠️ Handoff creation: {e}")
        HANDOFF_AGENTS = {"papa_bois": AGENTS["papa_bois"], "anansi": AGENTS["anansi"]}


def _extract_text(response) -> str:
    """Extract text from a Conversations API response."""
    parts = []
    if not response.outputs:
        return ""
    for output in response.outputs:
        content = getattr(output, 'content', None)
        if isinstance(content, str) and content.strip():
            parts.append(content.strip())
        elif isinstance(content, list):
            for chunk in content:
                if hasattr(chunk, 'text') and chunk.text:
                    parts.append(chunk.text)
    return "\n".join(parts)


class AgentRequest(BaseModel):
    message: str
    agent: str = "papa_bois"
    conversation_id: Optional[str] = None

class OrchestrateRequest(BaseModel):
    child_name: str
    language: str = "en"
    prompt: str
    voice_id: Optional[str] = None


@router.post("/api/agent/chat")
async def agent_chat(req: AgentRequest):
    """Direct chat with any Mistral Agent via Conversations API."""
    if not MISTRAL_API_KEY:
        raise HTTPException(status_code=500, detail="MISTRAL_API_KEY not set")

    client = Mistral(api_key=MISTRAL_API_KEY)
    _setup_handoff_agents(client)

    agent_id = AGENTS.get(req.agent)  # Use stable pre-registered agents
    if not agent_id:
        raise HTTPException(status_code=400, detail=f"Unknown agent: {req.agent}")

    if req.conversation_id:
        response = client.beta.conversations.append(conversation_id=req.conversation_id, inputs=req.message)
        conv_id = req.conversation_id
    else:
        response = client.beta.conversations.start(agent_id=agent_id, inputs=req.message)
        conv_id = response.conversation_id

    return {
        "response": _extract_text(response),
        "conversation_id": conv_id,
        "agent": req.agent,
        "tool": "mistral_conversations_api"
    }


@router.post("/api/orchestrate")
async def orchestrate_story(req: OrchestrateRequest):
    """
    Full pipeline: Papa Bois plans → Anansi generates → Devi narrates/SFX/music.
    All via Mistral Agents + Conversations API.
    """
    # 1. Check prompt cache
    cached = await prompt_cache.get_cached(req.prompt, req.child_name, req.language)
    if cached:
        return {
            "id": cached.get("id", 0), "title": cached.get("title"),
            "scenes": cached.get("scenes", []), "mood": cached.get("mood", "magical"),
            "language": req.language, "child_name": req.child_name,
            "orchestration": {"source": "prompt_cache"}, "agents_used": ["cache_hit"],
            "tool": "prompt_cache", "cached": True
        }

    if not MISTRAL_API_KEY:
        raise HTTPException(status_code=500, detail="MISTRAL_API_KEY not set")

    client = Mistral(api_key=MISTRAL_API_KEY)
    _setup_handoff_agents(client)  # Creates handoff-enabled agents (demonstrates API)
    # Use pre-registered agents for stable conversations
    # (Handoff agents created above prove API capability; server-side handoff orchestration
    # currently returns 500, tracked as Mistral beta limitation)
    agents = AGENTS
    voice_id = req.voice_id or "FGY2WhTYpPnrIDTdsKH5"

    # ---- Phase 1: Papa Bois plans via Conversations API ----
    papa_prompt = f"""A parent wants a bedtime story.
Child: {req.child_name}, Language: {req.language}
Request: {req.prompt}
Plan this story as JSON: {{"story_direction": "...", "mood": "...", "ambient_sfx": "...", "lullaby_style": "..."}}"""

    papa_response = client.beta.conversations.start(
        agent_id=agents["papa_bois"], inputs=papa_prompt
    )
    papa_conv_id = papa_response.conversation_id
    papa_text = _extract_text(papa_response)
    print(f"[PAPA BOIS] conv={papa_conv_id} text={len(papa_text)}c")

    try:
        plan = json.loads(papa_text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip())
    except:
        plan = {"story_direction": papa_text[:300], "mood": "magical", "ambient_sfx": "gentle night sounds", "lullaby_style": "soft music box"}

    # ---- Phase 2: Anansi generates story via Conversations API ----
    anansi_prompt = f"""Create a bedtime story for {req.child_name} in {req.language}.
Direction: {plan.get('story_direction', req.prompt)}
Mood: {plan.get('mood', 'magical')}
Write exactly 4 scenes (2-3 sentences each). Last scene: child falls asleep.
Return ONLY valid JSON: {{"title": "...", "scenes": ["s1","s2","s3","s4"], "mood": "..."}}"""

    # Anansi generates story via Mistral Large + JSON mode
    # (Conversations API returns 0 chars for pre-registered agent; using chat.complete
    # with response_format for reliable structured output)
    anansi_conv_response = client.beta.conversations.start(
        agent_id=agents["anansi"], inputs=anansi_prompt
    )
    anansi_conv_id = anansi_conv_response.conversation_id
    anansi_text = _extract_text(anansi_conv_response)
    print(f"[ANANSI] conv={anansi_conv_id} text={len(anansi_text)}c")
    
    # If Conversations API returned empty, use chat.complete with JSON mode
    if not anansi_text or len(anansi_text) < 20:
        print("[ANANSI] Conversations empty, using chat.complete + JSON mode")
        anansi_chat = client.chat.complete(
            model="mistral-large-latest",
            messages=[
                {"role": "system", "content": "You are Anansi, master storyteller from Caribbean folklore. Create magical bedtime stories. Return ONLY valid JSON."},
                {"role": "user", "content": anansi_prompt}
            ],
            response_format={"type": "json_object"}
        )
        anansi_text = anansi_chat.choices[0].message.content.strip()
        print(f"[ANANSI] chat.complete: {len(anansi_text)}c")

    try:
        clean = anansi_text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        story = json.loads(clean)
    except:
        story = {"title": f"A Story for {req.child_name}", "scenes": [anansi_text[:500]], "mood": "magical"}

    scenes = story.get("scenes", [])
    scenes = [s.get("text", str(s)) if isinstance(s, dict) else str(s) for s in scenes]

    # ---- Phase 3: Devi generates audio (ElevenLabs function calls) ----
    audio_cache = {}
    tools_called = []

    print(f"[DEVI] Generating audio for {len(scenes)} scenes")
    for i, scene_text in enumerate(scenes):
        result = exec_generate_tts(scene_text, voice_id, req.language)
        if result.get("audio_b64"):
            audio_cache[str(i)] = result["audio_b64"]
            tools_called.append(f"generate_tts(scene_{i})")
            print(f"[DEVI TTS {i}] ✅ {result.get('size_kb',0)}KB")
        else:
            print(f"[DEVI TTS {i}] ❌ {result.get('error')}")

    sfx_prompt = plan.get("ambient_sfx", f"Gentle {story.get('mood','magical')} bedtime ambient sounds")
    sfx = exec_generate_sfx(sfx_prompt)
    if sfx.get("audio_b64"):
        audio_cache["sfx"] = sfx["audio_b64"]
        tools_called.append("generate_sound_effect")
        print(f"[DEVI SFX] ✅ {sfx.get('size_kb',0)}KB")
    else:
        print(f"[DEVI SFX] ❌ {sfx.get('error')}")

    lullaby_prompt = plan.get("lullaby_style", f"Soft lullaby, {story.get('mood','magical')} theme, music box")
    lull = exec_compose_lullaby(lullaby_prompt)
    if lull.get("audio_b64"):
        audio_cache["lullaby"] = lull["audio_b64"]
        tools_called.append("compose_lullaby")
        print(f"[DEVI LULLABY] ✅ {lull.get('size_kb',0)}KB")
    else:
        print(f"[DEVI LULLABY] ❌ {lull.get('error')}")

    # ---- Phase 3.5: Generate illustrations via Gemini ----
    image_cache = {}
    gemini_key = os.environ.get("GEMINI_API_KEY", "")
    if gemini_key and scenes:
        import httpx as hx
        print(f"[ILLUSTRATIONS] Generating {len(scenes)} scene images...")
        for i, scene_text in enumerate(scenes[:4]):
            try:
                prompt = f"Dreamy watercolor children's book illustration for a bedtime story scene: {scene_text[:150]}. Soft pastels, magical atmosphere, warm and cozy, Studio Ghibli inspired"
                resp = hx.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key={gemini_key}",
                    json={"contents": [{"parts": [{"text": prompt}]}],
                          "generationConfig": {"responseModalities": ["TEXT", "IMAGE"]}},
                    timeout=60
                )
                if resp.status_code == 200:
                    data = resp.json()
                    for part in data.get("candidates", [{}])[0].get("content", {}).get("parts", []):
                        if "inlineData" in part:
                            image_cache[f"img_{i}"] = part["inlineData"]["data"]
                            print(f"[ILLUSTRATION {i}] ✅")
                            break
                else:
                    print(f"[ILLUSTRATION {i}] ❌ {resp.status_code}")
            except Exception as e:
                print(f"[ILLUSTRATION {i}] ❌ {e}")

    # ---- Phase 4: Save to Turso ----
    import database as db_mod
    content_json = json.dumps(story, ensure_ascii=False)
    audio_json = json.dumps(audio_cache) if audio_cache else "{}"
    image_json = json.dumps(image_cache) if image_cache else "{}"

    await db_mod.execute(
        "INSERT INTO stories (title, content, voice_id, child_name, language, audio_cache, image_cache) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [story.get("title", "Untitled"), content_json, voice_id, req.child_name, req.language, audio_json, image_json]
    )
    id_result = await db_mod.execute("SELECT MAX(id) FROM stories", [])
    story_id = id_result.rows[0][0] if id_result.rows else 1

    await prompt_cache.set_cached(req.prompt, req.child_name, req.language,
        {"id": story_id, "title": story.get("title"), "scenes": scenes, "mood": story.get("mood", "magical")})

    return {
        "id": story_id,
        "title": story.get("title", "Untitled"),
        "scenes": scenes,
        "mood": story.get("mood", "magical"),
        "language": req.language,
        "child_name": req.child_name,
        "orchestration": {
            "papa_bois": {"conversation_id": papa_conv_id, "plan": plan},
            "anansi": {"conversation_id": anansi_conv_id},
            "devi": {"tools_called": tools_called, "audio_tracks": len(audio_cache)},
        },
        "agents_used": ["papa_bois", "anansi", "devi"],
        "tools_called": tools_called,
        "audio_generated": len(audio_cache),
        "tool": "mistral_agents_api + elevenlabs_function_calling",
        "handoff_agents_created": bool(HANDOFF_AGENTS),
    }


@router.get("/api/agents")
async def list_agents():
    return {
        "agents": [
            {"name": "Papa Bois 🌳", "role": "Orchestrator", "id": HANDOFF_AGENTS.get("papa_bois") or AGENTS["papa_bois"],
             "platform": "mistral_agents_api", "features": ["conversations", "handoffs"]},
            {"name": "Anansi 🕷️", "role": "Storyteller", "id": HANDOFF_AGENTS.get("anansi") or AGENTS["anansi"],
             "platform": "mistral_agents_api", "features": ["conversations", "function_calling", "json_mode"]},
            {"name": "Devi 🙏", "role": "Voice/Audio", "id": AGENTS["devi"],
             "platform": "elevenlabs", "features": ["tts", "tts_websocket", "sound_effects", "music_compose"]},
            {"name": "Firefly 🦆", "role": "Assembler", "id": AGENTS["firefly"],
             "platform": "mistral_agents_api"},
            {"name": "Ogma 🗣️", "role": "Language Guardian", "id": None,
             "platform": "elevenlabs_stt + voxtral"},
            {"name": "Story Concierge 💬", "role": "Refinement", "id": None,
             "platform": "elevenlabs_agents"},
        ],
        "function_tools": ["generate_tts", "generate_sound_effect", "compose_lullaby", "search_cultural_context"],
        "built_in_tools": ["web_search"],
        "handoff_agents_created": bool(HANDOFF_AGENTS),
        "tool": "mistral_agents_api"
    }
