"""
Seed one story per language with cached audio for demo.
"""
import os, json, base64, httpx, time

ELEVENLABS_API_KEY = os.environ["ELEVENLABS_API_KEY"]
MISTRAL_API_KEY = os.environ["MISTRAL_API_KEY"]
TURSO_URL = "https://sandmantales-monkfenix.aws-ap-northeast-1.turso.io"
TURSO_TOKEN = os.environ["TURSO_AUTH_TOKEN"]
HEADERS_TURSO = {"Authorization": f"Bearer {TURSO_TOKEN}", "Content-Type": "application/json"}

def turso_exec(sql, params=None):
    body = {"statements": [{"q": sql, "params": params or []}]}
    r = httpx.post(TURSO_URL, headers=HEADERS_TURSO, json=body, timeout=30)
    return r.json()

def generate_story(child_name, language, prompt):
    from mistralai import Mistral
    client = Mistral(api_key=MISTRAL_API_KEY)
    lang_map = {"en":"English","fr":"French","ja":"Japanese","hi":"Hindi","es":"Spanish",
                "pt":"Portuguese","de":"German","zh":"Chinese","ar":"Arabic","ko":"Korean"}
    resp = client.chat.complete(
        model="mistral-large-latest",
        messages=[
            {"role": "system", "content": f"You are Anansi, master storyteller. Create a bedtime story for {child_name} in {lang_map.get(language,'English')}. 4 scenes, 2-3 sentences each. Gentle tone. Return JSON: {{\"title\": \"...\", \"scenes\": [\"s1\",\"s2\",\"s3\",\"s4\"], \"mood\": \"magical\"}}"},
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"}
    )
    return json.loads(resp.choices[0].message.content.strip())

def generate_audio(text, voice_id="FGY2WhTYpPnrIDTdsKH5"):
    r = httpx.post(f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
        headers={"xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json"},
        json={"text": text, "model_id": "eleven_multilingual_v2",
              "voice_settings": {"stability": 0.6, "similarity_boost": 0.8}}, timeout=30)
    if r.status_code != 200:
        print(f"    TTS error {r.status_code}: {r.text[:100]}")
        return None
    return base64.b64encode(r.content).decode()

# Stories we already have (skip these languages)
existing = turso_exec("SELECT DISTINCT language FROM stories", [])
existing_langs = set()
if "results" in existing:
    for res in existing["results"]:
        if "rows" in res:
            for row in res["rows"]:
                existing_langs.add(row[0])
print(f"Existing languages: {existing_langs}")

# Languages to generate
demos = [
    {"child_name": "Sophie", "lang": "fr", "prompt": "Sophie loves whales and clouds", "voice": "FGY2WhTYpPnrIDTdsKH5"},
    {"child_name": "Kai", "lang": "ja", "prompt": "Kai loves stars and space rockets", "voice": "pNInz6obpgDQGcFmaJgB"},
    {"child_name": "Emma", "lang": "en", "prompt": "Emma loves butterflies and rainbows", "voice": "EXAVITQu4vr4xnSDxMaL"},
    {"child_name": "Priya", "lang": "hi", "prompt": "Priya loves elephants and monsoon rains", "voice": "FGY2WhTYpPnrIDTdsKH5"},
    {"child_name": "Lucia", "lang": "es", "prompt": "Lucia loves the ocean and sea turtles", "voice": "FGY2WhTYpPnrIDTdsKH5"},
    {"child_name": "Miguel", "lang": "pt", "prompt": "Miguel loves football and the Amazon jungle", "voice": "pNInz6obpgDQGcFmaJgB"},
    {"child_name": "Lena", "lang": "de", "prompt": "Lena loves snow and Christmas markets", "voice": "FGY2WhTYpPnrIDTdsKH5"},
    {"child_name": "Mei", "lang": "zh", "prompt": "Mei loves pandas and cherry blossoms", "voice": "FGY2WhTYpPnrIDTdsKH5"},
    {"child_name": "Yasmin", "lang": "ar", "prompt": "Yasmin loves the desert stars and camels", "voice": "FGY2WhTYpPnrIDTdsKH5"},
    {"child_name": "Jimin", "lang": "ko", "prompt": "Jimin loves K-pop and dancing in the rain", "voice": "pNInz6obpgDQGcFmaJgB"},
]

for d in demos:
    if d["lang"] in existing_langs:
        print(f"⏭️  Skipping {d['lang']} ({d['child_name']}) — already exists")
        continue
    
    print(f"\n🕷️ Generating {d['lang']} story for {d['child_name']}...")
    try:
        story = generate_story(d["child_name"], d["lang"], d["prompt"])
        print(f"  Title: {story['title']}")
        
        # Generate audio for first 2 scenes (save credits) + narrate the rest on demand
        audio_cache = {}
        for i, scene in enumerate(story["scenes"]):
            print(f"  🎙️ Narrating scene {i+1}/{len(story['scenes'])}...")
            audio = generate_audio(scene, d["voice"])
            if audio:
                audio_cache[str(i)] = audio
                print(f"    ✅ {len(audio)//1024}KB")
            time.sleep(0.5)  # rate limit
        
        # Save
        content_json = json.dumps(story, ensure_ascii=False)
        audio_json = json.dumps(audio_cache)
        turso_exec(
            "INSERT INTO stories (title, content, voice_id, child_name, language, audio_cache) VALUES (?, ?, ?, ?, ?, ?)",
            [story["title"], content_json, d["voice"], d["child_name"], d["lang"], audio_json]
        )
        print(f"  💾 Saved with {len(audio_cache)} audio tracks")
        existing_langs.add(d["lang"])
    except Exception as e:
        print(f"  ❌ Error: {e}")

print(f"\n✅ Done! Languages in library: {existing_langs}")
