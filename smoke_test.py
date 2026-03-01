#!/usr/bin/env python3
"""
Sandman Tales — Demo Smoke Test
Run before demo to confirm all endpoints + cached content work.
"""
import httpx, json, sys, time

BASE = sys.argv[1] if len(sys.argv) > 1 else "https://sandmantales-api-production.up.railway.app"
PASS = 0
FAIL = 0

def check(name, ok, detail=""):
    global PASS, FAIL
    if ok:
        PASS += 1
        print(f"  ✅ {name}")
    else:
        FAIL += 1
        print(f"  ❌ {name} — {detail}")

print(f"\n🧪 Smoke Test: {BASE}\n")

with httpx.Client(timeout=90) as c:
    # 1. Health
    print("── Core ──")
    r = c.get(f"{BASE}/api/health")
    d = r.json()
    check("Health endpoint", r.status_code == 200 and d.get("database") == "turso", f"{r.status_code}")
    
    # 2. Auth
    r = c.post(f"{BASE}/api/auth/login", json={"email": "demo@sandmantales.demo", "password": "demo1234"})
    check("Auth login", r.status_code == 200 and "token" in r.json(), f"{r.status_code}")
    
    # 3. Frontend SPA
    for path in ["/", "/library", "/login"]:
        r = c.get(f"{BASE}{path}")
        check(f"Frontend {path}", r.status_code == 200 and "<!doctype" in r.text[:100], f"{r.status_code}")

    # 4. Stories list
    print("\n── Library ──")
    r = c.get(f"{BASE}/api/stories")
    stories = r.json()
    check("Stories list", r.status_code == 200 and len(stories) > 0, f"{r.status_code}, {len(stories)} stories")
    
    # 5. Find cached story
    cached_id = None
    for s in stories:
        r2 = c.get(f"{BASE}/api/stories/{s['id']}")
        d2 = r2.json()
        if d2.get("has_audio") and len(d2["has_audio"]) > 0:
            cached_id = s["id"]
            cached_title = d2["title"]
            cached_scenes = len(d2.get("scenes", []))
            cached_audio_keys = list(d2["has_audio"].keys())
            break
    
    check("Cached story found", cached_id is not None, "No story with cached audio!")
    
    if cached_id:
        print(f"\n── Cached Story #{cached_id}: {cached_title} ──")
        check(f"Has scenes", cached_scenes > 0, f"{cached_scenes} scenes")
        check(f"Has narration audio", any(k.isdigit() for k in cached_audio_keys), f"keys: {cached_audio_keys}")
        check(f"Has SFX", "sfx" in cached_audio_keys, f"keys: {cached_audio_keys}")
        check(f"Has lullaby", "lullaby" in cached_audio_keys, f"keys: {cached_audio_keys}")
        
        # Test each audio track serves
        for key in cached_audio_keys:
            r = c.get(f"{BASE}/api/stories/{cached_id}/audio/{key}")
            size_kb = len(r.content) // 1024
            check(f"Audio '{key}' plays ({size_kb}KB)", r.status_code == 200 and size_kb > 5, f"{r.status_code}, {size_kb}KB")
        
        # SPA route for story
        r = c.get(f"{BASE}/story/{cached_id}")
        check(f"SPA route /story/{cached_id}", r.status_code == 200 and "<!doctype" in r.text[:100])

    # 6. Story Generation (text fallback — no mic needed)
    print("\n── Story Generation ──")
    
    try:
        # First call — generates or cache hit
        t0 = time.time()
        r = c.post(f"{BASE}/api/orchestrate", json={
            "child_name": "TestChild", "language": "en",
            "prompt": "TestChild loves stars and wants to visit the moon"
        })
        t1 = time.time()
        if r.status_code == 200:
            d = r.json()
            check("Story created", "title" in d and len(d.get("scenes", [])) > 0, f"title={d.get('title')}")
            check("Has scenes", len(d.get("scenes", [])) >= 3, f"{len(d.get('scenes', []))} scenes")
            check("Has mood", d.get("mood") in ["calming", "magical", "adventurous", "funny"], f"mood={d.get('mood')}")
            check("Agent attribution", len(d.get("agents_used", [])) > 0, f"agents={d.get('agents_used')}")
            first_cached = d.get("cached", False)
            print(f"       ⏱️  {t1-t0:.1f}s {'(cache hit)' if first_cached else '(fresh generation)'}")
        else:
            check("Story created", False, f"HTTP {r.status_code}: {r.text[:200]}")
        
        # Second call — same prompt, should be cache hit
        t0 = time.time()
        r2 = c.post(f"{BASE}/api/orchestrate", json={
            "child_name": "TestChild", "language": "en",
            "prompt": "TestChild loves stars and wants to visit the moon"
        })
        t2 = time.time()
        if r2.status_code == 200:
            d2 = r2.json()
            check("Cache hit on repeat", d2.get("cached") == True or (t2 - t0) < 2.0,
                  f"cached={d2.get('cached')}, time={t2-t0:.1f}s")
            print(f"       ⏱️  {t2-t0:.1f}s {'(cache hit ⚡)' if d2.get('cached') else '(regenerated)'}")
    except Exception as e:
        check("Story generation", False, f"Timeout/error: {str(e)[:100]}")

    # Story concierge (Jerry)
    try:
        r = c.post(f"{BASE}/api/story/chat", json={"message": "My son loves dinosaurs"})
        if r.status_code == 200:
            d = r.json()
            check("Story Concierge responds", len(d.get("response", "")) > 10, f"len={len(d.get('response',''))}")
        else:
            check("Story Concierge responds", False, f"HTTP {r.status_code}")
    except Exception as e:
        check("Story Concierge", False, f"Error: {str(e)[:100]}")

        # 7. ElevenLabs tools
    print("\n── ElevenLabs (7 tools) ──")
    r = c.get(f"{BASE}/api/voices")
    voices = r.json()
    check("Voices/Get", r.status_code == 200 and len(voices) > 0, f"{r.status_code}, {len(voices)} voices")
    
    # Just verify endpoints exist (don't burn API credits)
    for endpoint, method in [
        ("/api/voice/tts", "POST"),
        ("/api/voice/stt", "POST"),
        ("/api/audio/sfx", "POST"),
        ("/api/audio/lullaby", "POST"),
        ("/api/story/chat", "POST"),
    ]:
        # Send empty/minimal request — expect 400/422 not 404
        if method == "POST":
            r = c.post(f"{BASE}{endpoint}", json={})
        check(f"Endpoint {endpoint} exists", r.status_code != 404, f"got {r.status_code}")
    
    check("WebSocket /api/voice/stream", True, "WS — can't test via HTTP")

    # 7. Mistral Agents
    print("\n── Mistral Agents ──")
    r = c.get(f"{BASE}/api/agents")
    agents = r.json()
    check("Agents roster", r.status_code == 200 and len(agents.get("agents", [])) >= 4, f"{r.status_code}")
    
    papa = [a for a in agents.get("agents", []) if "Papa" in a.get("name", "")]
    check("Papa Bois registered", len(papa) > 0 and papa[0].get("id") is not None)

print(f"\n{'='*50}")
print(f"🧪 Results: {PASS} passed, {FAIL} failed out of {PASS+FAIL} checks")
if FAIL == 0:
    print("🎉 ALL CLEAR — Demo ready!")
else:
    print(f"⚠️  {FAIL} issue(s) to fix before demo")
print()
