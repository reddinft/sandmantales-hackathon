#!/bin/bash
export OP_SERVICE_ACCOUNT_TOKEN=$(cat ~/.config/openclaw/.op-service-token)
export ELEVENLABS_API_KEY=$(op read "op://OpenClaw/ElevenLabs API Credentials/credential")
export MISTRAL_API_KEY=$(op read "op://OpenClaw/Mistral Hackathon API Credentials/credential")
cd /tmp/sandmantales-hackathon
echo "🌙 Starting Sandman Tales backend on :8001..."
/Users/loki/.pyenv/versions/3.14.3/bin/python3 -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload
