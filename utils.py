import os
import requests
from typing import Optional
from pydantic import BaseModel

# Utility functions for the Sandman Tales backend
def validate_story_data(title: str, content: str) -> bool:
    """Validate story data before insertion."""
    return bool(title.strip()) and bool(content.strip())


def narrate_scene(text: str, language: str = "en") -> bytes:
    """
    Narrate a scene text in a given language using ElevenLabs API (eleven_multilingual_v2 model).
    Returns MP3 bytes.

    Args:
        text (str): The text to narrate.
        language (str): Language code ("en", "ja", "fr", "hi"). Defaults to "en".

    Returns:
        bytes: MP3 audio bytes.

    Raises:
        ValueError: If the language is not supported.
        Exception: If the API request fails.
    """
    # Voice ID mapping for supported languages
    voice_ids = {
        "en": "pNInz6obpgDQGcFmaJgB",  # English
        "ja": "oWAxZDozJ7GehX8VzUYV",  # Japanese
        "fr": "EXAVITQu4vr4xnSDxMaL",  # French
        "hi": "5Q0t7uMcjvnagumLfvZi",  # Hindi
    }

    # Check if language is supported
    if language not in voice_ids:
        raise ValueError(f"Unsupported language: {language}. Supported languages: {list(voice_ids.keys())}")

    # ElevenLabs API endpoint and headers
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_ids[language]}"
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": os.getenv("ELEVENLABS_API_KEY"),
    }

    # Request payload
    data = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.5,
        }
    }

    # Make the API request
    response = requests.post(url, json=data, headers=headers)

    if response.status_code != 200:
        raise Exception(f"ElevenLabs API request failed: {response.text}")

    return response.content