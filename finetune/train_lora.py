#!/usr/bin/env python3
"""LoRA fine-tuning for FLUX.1-schnell on Apple Silicon (MPS)
Training data: 20 Imagen 4.0 storybook illustrations"""

import os, sys, json, time, logging
from pathlib import Path
from datetime import datetime
import torch
from PIL import Image
from torch.utils.data import Dataset, DataLoader

log_path = "/tmp/lora_training.log"
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.FileHandler(log_path), logging.StreamHandler()])
log = logging.getLogger(__name__)

TRAINING_DIR = "/tmp/sandmantales-hackathon/training_images_imagen"
PROMPT_DIR = "/tmp/sandmantales-hackathon/training_data"
OUTPUT_DIR = "/tmp/sandmantales-hackathon/finetune/output"
CHECKPOINT_DIR = "/tmp/sandmantales-hackathon/finetune/checkpoints"
STATUS_FILE = "/tmp/lora_training_status.json"
MODEL_ID = "black-forest-labs/FLUX.1-schnell"
RESOLUTION = 512
TRAIN_STEPS = 500
LEARNING_RATE = 1e-4
LORA_RANK = 4
BATCH_SIZE = 1
GRADIENT_ACCUMULATION = 4
SAVE_EVERY = 100

def update_status(step, total, loss, eta_min=None, error=None, phase="training"):
    with open(STATUS_FILE, "w") as f:
        json.dump({"step": step, "total_steps": total, "loss": float(loss) if loss else None,
            "percent": round(step/total*100,1) if total>0 else 0, "eta_minutes": eta_min,
            "error": error, "phase": phase, "updated": datetime.now().isoformat(), "pid": os.getpid()}, f, indent=2)

class StoryImageDataset(Dataset):
    def __init__(self, image_dir, prompt_dir, resolution=512):
        self.images = sorted(Path(image_dir).glob("*.png"))
        self.prompt_dir = Path(prompt_dir)
        self.resolution = resolution
        log.info(f"Dataset: {len(self.images)} images at {resolution}x{resolution}")
    def __len__(self): return len(self.images)
    def __getitem__(self, idx):
        img_path = self.images[idx]
        prompt_file = self.prompt_dir / f"{img_path.stem}.txt"
        prompt = prompt_file.read_text().strip() if prompt_file.exists() else "children book illustration, watercolor style"
        image = Image.open(img_path).convert("RGB").resize((self.resolution, self.resolution), Image.LANCZOS)
        return {"image": image, "prompt": prompt}

def main():
    log.info("=" * 60)
    log.info("FLUX LoRA Fine-Tuning — Sandman Tales Storybook Style")
    log.info(f"Steps: {TRAIN_STEPS}, LR: {LEARNING_RATE}, Rank: {LORA_RANK}, Res: {RESOLUTION}")
    log.info("=" * 60)
    update_status(0, TRAIN_STEPS, None, phase="loading_model")

    device = torch.device("mps")
    log.info(f"Using device: {device}")

    log.info("Loading FLUX.1-schnell pipeline...")
    from diffusers import FluxPipeline
    from peft import LoraConfig, get_peft_model
    import torchvision.transforms as T

    pipe = FluxPipeline.from_pretrained(MODEL_ID, torch_dtype=torch.float32)
    log.info("Pipeline loaded")

    transformer = pipe.transformer
    log.info(f"Transformer: {sum(p.numel() for p in transformer.parameters())/1e6:.1f}M params")

    log.info(f"Applying LoRA (rank={LORA_RANK})...")
    lora_config = LoraConfig(r=LORA_RANK, lora_alpha=LORA_RANK,
        target_modules=["to_q", "to_k", "to_v", "to_out.0"], lora_dropout=0.05)
    transformer = get_peft_model(transformer, lora_config)
    trainable = sum(p.numel() for p in transformer.parameters() if p.requires_grad)
    total_p = sum(p.numel() for p in transformer.parameters())
    log.info(f"Trainable: {trainable/1e6:.2f}M / {total_p/1e6:.1f}M ({trainable/total_p*100:.2f}%)")

    update_status(0, TRAIN_STEPS, None, phase="moving_to_device")
    log.info("Moving to MPS...")
    transformer = transformer.to(device)
    vae = pipe.vae.to(device)
    text_encoder = pipe.text_encoder
    tokenizer = pipe.tokenizer
    text_encoder_2 = getattr(pipe, 'text_encoder_2', None)
    tokenizer_2 = getattr(pipe, 'tokenizer_2', None)
    scheduler = pipe.scheduler
    del pipe
    torch.mps.empty_cache()
    log.info("Model on device")

    dataset = StoryImageDataset(TRAINING_DIR, PROMPT_DIR, RESOLUTION)
    dataloader = DataLoader(dataset, batch_size=BATCH_SIZE, shuffle=True)

    optimizer = torch.optim.AdamW([p for p in transformer.parameters() if p.requires_grad],
        lr=LEARNING_RATE, weight_decay=0.01)

    transform = T.Compose([T.ToTensor(), T.Normalize([0.5], [0.5])])

    log.info("Starting training loop...")
    update_status(0, TRAIN_STEPS, None, phase="training")
    start_time = time.time()
    global_step = 0
    running_loss = 0.0
    transformer.train()

    while global_step < TRAIN_STEPS:
        for batch in dataloader:
            if global_step >= TRAIN_STEPS: break
            try:
                image = batch["image"][0]
                pixel_values = transform(image).unsqueeze(0).to(device)
                with torch.no_grad():
                    latents = vae.encode(pixel_values).latent_dist.sample()
                    latents = latents * vae.config.scaling_factor

                prompt = batch["prompt"][0]
                text_inputs = tokenizer(prompt, padding="max_length",
                    max_length=tokenizer.model_max_length, truncation=True, return_tensors="pt")
                with torch.no_grad():
                    text_emb = text_encoder(text_inputs.input_ids.to(text_encoder.device))[0]

                noise = torch.randn_like(latents)
                timesteps = torch.randint(0, 1000, (1,), device=device).long()
                noisy = latents + noise * (timesteps.float()/1000).view(-1,1,1,1)

                noise_pred = transformer(hidden_states=noisy, encoder_hidden_states=text_emb.to(device),
                    timestep=timesteps, return_dict=False)[0]

                loss = torch.nn.functional.mse_loss(noise_pred, noise) / GRADIENT_ACCUMULATION
                loss.backward()
                running_loss += loss.item()

                if (global_step+1) % GRADIENT_ACCUMULATION == 0:
                    torch.nn.utils.clip_grad_norm_(transformer.parameters(), 1.0)
                    optimizer.step()
                    optimizer.zero_grad()

                global_step += 1
                elapsed = time.time() - start_time
                sps = global_step / elapsed if elapsed > 0 else 0
                remaining = (TRAIN_STEPS - global_step) / sps / 60 if sps > 0 else 0
                avg_loss = running_loss / global_step

                if global_step % 10 == 0:
                    log.info(f"Step {global_step}/{TRAIN_STEPS} | Loss: {avg_loss:.4f} | {sps:.2f} s/s | ETA: {remaining:.1f}min")
                    update_status(global_step, TRAIN_STEPS, avg_loss, eta_min=round(remaining,1))

                if global_step % SAVE_EVERY == 0:
                    ckpt = os.path.join(CHECKPOINT_DIR, f"checkpoint-{global_step}")
                    transformer.save_pretrained(ckpt)
                    log.info(f"Checkpoint: {ckpt}")

                if global_step % 50 == 0: torch.mps.empty_cache()

            except Exception as e:
                log.error(f"Step {global_step}: {e}")
                update_status(global_step, TRAIN_STEPS, running_loss/max(global_step,1), error=str(e))
                global_step += 1
                continue

    final_path = os.path.join(OUTPUT_DIR, "lora_final")
    transformer.save_pretrained(final_path)
    total_time = (time.time() - start_time) / 60
    log.info(f"DONE! {total_time:.1f} min. Saved to {final_path}")
    update_status(TRAIN_STEPS, TRAIN_STEPS, running_loss/TRAIN_STEPS, eta_min=0, phase="complete")

if __name__ == "__main__":
    main()
