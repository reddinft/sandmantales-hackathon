#!/bin/bash
# Auto-start LoRA training once all 20 images are generated
set -e

DATA_DIR="/tmp/sandmantales-hackathon/training_data"
PYTHON="/Users/loki/.kokoro-venv/bin/python3"

echo "Waiting for 20 training images..."
while true; do
    COUNT=$(ls -1 ${DATA_DIR}/*.png 2>/dev/null | wc -l | tr -d ' ')
    echo "  $(date +%H:%M:%S) — ${COUNT}/20 images ready"
    if [ "$COUNT" -ge 20 ]; then
        echo "✅ All 20 images ready! Starting training..."
        break
    fi
    sleep 60
done

cd /tmp/sandmantales-hackathon

# Stop Ollama to free memory for training
echo "Stopping Ollama to free RAM..."
pkill ollama 2>/dev/null || true
sleep 5

echo "🚀 Starting LoRA training..."
$PYTHON train_lora.py \
    --data_dir ./training_data \
    --output_dir ./lora_weights \
    --steps 500 \
    --lr 1e-4 \
    --rank 16 \
    --resolution 512 \
    --batch_size 1 \
    --log_every 25

echo "✅ Training complete!"

# Restart Ollama
echo "Restarting Ollama..."
ollama serve &>/dev/null &

echo "Done! Run compare_models.py next."
