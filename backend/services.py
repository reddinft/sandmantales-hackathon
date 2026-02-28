import os
from typing import Optional
from dotenv import load_dotenv
from mistralai import Mistral
import httpx

load_dotenv()

MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")

async def generate_story(prompt: str) -> str:
    client = Mistral(api_key=os.getenv('MISTRAL_API_KEY'))
    result = client.beta.conversations.start(agent_id="ag_019ca24f110677d7a92ec83a5c85704a", inputs=prompt)
    return result.get("output", "")

async def generate_voice(text: str) -> Optional[str]:
    url = "https://api.elevenlabs.io/v1/text-to-speech/voice_id"
    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json"
    }
    payload = {
        "text": text,
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.5
        }
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload, headers=headers)
        if response.status_code == 200:
            # Save audio file and return URL
            audio_data = response.content
            file_path = f"/tmp/voice_{hash(text)}.mp3"
            with open(file_path, "wb") as f:
                f.write(audio_data)
            return f"file://{file_path}"
        else:
            print(f"Voice generation failed: {response.status_code}")
            return None

async def generate_illustration(prompt: str) -> Optional[str]:
    url = "http://localhost:3000/generate"  # mflux-generate endpoint
    payload = {
        "prompt": prompt,
        "model": "FLUX.1-schnell"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload)
        if response.status_code == 200:
            result = response.json()
            return result.get("image_url")
        else:
            print(f"Illustration generation failed: {response.status_code}")
            return None