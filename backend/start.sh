#!/bin/bash
export MISTRAL_API_KEY="gIdtBVK7mXSA0Yk8hgfeZYxAYKwmIjrZ"
export ELEVENLABS_API_KEY="sk_acc768d85c586368503ac39bc3946dac6d72191018481287"
cd /tmp/sandmantales/hackathon/backend
exec /Users/loki/.pyenv/versions/3.14.3/bin/python3 -m uvicorn main:app --host 0.0.0.0 --port 8001
