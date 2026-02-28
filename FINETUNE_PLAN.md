# FLUX Fine-Tuning Plan — Sandman Tales
_Researched by Doc (Mistral Large) + Firefly, 2026-02-28_

## Recommendation: LoRA with `diffusers`

**Why LoRA over DreamBooth/full fine-tune:**
- Trains on 24GB Apple Silicon M4 in **1–3 hours** (1000 steps, batch 1)
- 15–30 images is enough for style transfer (storybook illustration aesthetic)
- DreamBooth = character-specific (overkill for style). Full fine-tune = too slow.
- `diffusers` MPS backend is better tested on Apple Silicon than Kohya

## Training Data Needed
- **15–30 images** at 512×512 or 768×768
- Style: whimsical watercolour/storybook (Beatrix Potter, Studio Ghibli-ish)
- Content diversity: characters, scenes, close-ups, backgrounds
- Format: PNG + caption `.txt` sidecar per image

**Sources (no license issues):**
- Our own FLUX-generated illustrations (we have 3, generate ~12 more)
- Pathfinder generates detailed style-consistent prompts, Firefly generates images

## Estimated Timeline
| Step | Time | Who |
|------|------|-----|
| Curate 20 training images via mflux | ~1h | Firefly (Vibe CLI) |
| Write training captions | 20min | Pathfinder |
| Build diffusers LoRA training script | 45min | Firefly |
| Train LoRA (1000 steps, M4 24GB) | 1–3h | Mac Mini (unattended) |
| Validate + test outputs | 30min | Lifeline |
| Integrate LoRA weights into backend | 30min | Firefly |
| W&B logging for prize submission | 20min | Doc |
| **Total** | **~5–6h** | |

## Division of Work

| Agent | Task |
|-------|------|
| **Doc** | Orchestrate via team.py. Write W&B experiment card. |
| **Pathfinder** | Generate 20 style-consistent training prompts. Write captions. |
| **Firefly** | Build `train_lora.py` via Vibe CLI. Integrate weights into backend. |
| **Lifeline** | A/B test: base FLUX vs fine-tuned. Score style consistency. |

## Technical Stack
```python
# Key deps
pip install diffusers>=0.28 peft transformers accelerate
# Training command (approximate)
python train_lora.py \
  --model_id black-forest-labs/FLUX.1-schnell \
  --train_data_dir ./training_data \
  --output_dir ./lora_weights \
  --num_train_epochs 1 \
  --num_steps 1000 \
  --lora_rank 32 \
  --resolution 512 \
  --batch_size 1
```

## Risk Assessment
- **Feasibility:** ✅ Doable in hackathon window (24h remaining)
- **Risk 1:** `diffusers` FLUX LoRA on Python 3.14 may have issues → use Python 3.12 venv
- **Risk 2:** Training might need 18–20GB VRAM → could clash with other services
- **Mitigation:** Stop Ollama + Image Gen Studio during training to free RAM
- **Risk 3:** Style might not converge in 1000 steps → train overnight if needed
- **W&B Prize:** Must log training metrics to W&B to qualify

## W&B Submission Angle
"We fine-tuned FLUX.1-schnell with a custom LoRA to generate consistent kid-safe, 
storybook-style illustrations — replacing generic diffusion output with a model 
that understands the aesthetic of bedtime stories."

## Verdict
**Start now.** Pathfinder generates training prompts → Firefly builds pipeline → 
train overnight → validate at 9am Sun → integrate before submission at 7pm.
