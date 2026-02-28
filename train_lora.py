#!/usr/bin/env python3
"""
LoRA fine-tuning script for FLUX.1-schnell on Apple Silicon.
Trains a storybook illustration style LoRA adapter.

Usage:
  ~/.kokoro-venv/bin/python3 train_lora.py \
    --data_dir ./training_data \
    --output_dir ./lora_weights \
    --steps 500 --lr 1e-4 --rank 16
"""

import argparse
import os
import torch
from pathlib import Path
from PIL import Image
from diffusers import FluxPipeline
from peft import LoraConfig, get_peft_model
import json
from datetime import datetime

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data_dir", type=str, default="./training_data")
    parser.add_argument("--output_dir", type=str, default="./lora_weights")
    parser.add_argument("--model_id", type=str, default="black-forest-labs/FLUX.1-schnell")
    parser.add_argument("--steps", type=int, default=500)
    parser.add_argument("--lr", type=float, default=1e-4)
    parser.add_argument("--rank", type=int, default=16)
    parser.add_argument("--resolution", type=int, default=512)
    parser.add_argument("--batch_size", type=int, default=1)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--log_every", type=int, default=50)
    return parser.parse_args()

def load_training_data(data_dir):
    """Load image-caption pairs from data_dir."""
    pairs = []
    data_path = Path(data_dir)
    for img_path in sorted(data_path.glob("*.png")):
        caption_path = img_path.with_suffix(".txt")
        if caption_path.exists():
            caption = caption_path.read_text().strip()
            pairs.append((str(img_path), caption))
    return pairs

def main():
    args = parse_args()
    os.makedirs(args.output_dir, exist_ok=True)
    
    device = "mps" if torch.backends.mps.is_available() else "cpu"
    dtype = torch.float32  # MPS needs float32
    print(f"Device: {device}, dtype: {dtype}")
    
    # Load training data
    pairs = load_training_data(args.data_dir)
    print(f"Loaded {len(pairs)} image-caption pairs")
    
    if len(pairs) == 0:
        print("❌ No training data found!")
        return
    
    # Load pipeline
    print("Loading FLUX pipeline...")
    pipe = FluxPipeline.from_pretrained(
        args.model_id,
        torch_dtype=dtype,
    )
    
    # Configure LoRA
    lora_config = LoraConfig(
        r=args.rank,
        lora_alpha=args.rank,
        target_modules=["to_q", "to_k", "to_v", "to_out.0"],
        lora_dropout=0.05,
    )
    
    # Apply LoRA to the transformer
    pipe.transformer = get_peft_model(pipe.transformer, lora_config)
    pipe.transformer.print_trainable_parameters()
    
    pipe = pipe.to(device)
    
    # Optimizer
    trainable_params = [p for p in pipe.transformer.parameters() if p.requires_grad]
    optimizer = torch.optim.AdamW(trainable_params, lr=args.lr, weight_decay=0.01)
    
    # Training log
    log = {"config": vars(args), "losses": [], "start_time": datetime.now().isoformat()}
    
    print(f"\n🚀 Starting LoRA training: {args.steps} steps, rank={args.rank}, lr={args.lr}")
    
    # Training loop
    torch.manual_seed(args.seed)
    for step in range(1, args.steps + 1):
        # Cycle through training data
        img_path, caption = pairs[(step - 1) % len(pairs)]
        
        # Load and preprocess image
        image = Image.open(img_path).convert("RGB").resize((args.resolution, args.resolution))
        
        # Encode image to latent space
        with torch.no_grad():
            image_tensor = torch.tensor(
                [(list(image.getdata()))], dtype=dtype, device=device
            ).reshape(1, args.resolution, args.resolution, 3).permute(0, 3, 1, 2) / 255.0
            image_tensor = image_tensor * 2.0 - 1.0  # Normalize to [-1, 1]
            
            latents = pipe.vae.encode(image_tensor).latent_dist.sample()
            latents = latents * pipe.vae.config.scaling_factor
        
        # Encode text
        with torch.no_grad():
            prompt_embeds, pooled_prompt_embeds, text_ids = pipe.encode_prompt(
                prompt=caption,
                prompt_2=caption,
            )
        
        # Add noise
        noise = torch.randn_like(latents)
        timestep = torch.randint(0, 1000, (1,), device=device).float()
        noisy_latents = latents + noise * (timestep / 1000.0)
        
        # Forward pass through transformer
        noise_pred = pipe.transformer(
            hidden_states=noisy_latents,
            timestep=timestep,
            encoder_hidden_states=prompt_embeds,
            pooled_projections=pooled_prompt_embeds,
            txt_ids=text_ids,
            img_ids=torch.zeros(1, latents.shape[2] * latents.shape[3], 3, device=device),
        ).sample
        
        # Loss
        loss = torch.nn.functional.mse_loss(noise_pred, noise)
        
        # Backward
        loss.backward()
        optimizer.step()
        optimizer.zero_grad()
        
        log["losses"].append({"step": step, "loss": loss.item()})
        
        if step % args.log_every == 0 or step == 1:
            print(f"  Step {step}/{args.steps} | Loss: {loss.item():.6f}")
    
    # Save LoRA weights
    print(f"\n💾 Saving LoRA weights to {args.output_dir}")
    pipe.transformer.save_pretrained(args.output_dir)
    
    # Save training log
    log["end_time"] = datetime.now().isoformat()
    log["final_loss"] = log["losses"][-1]["loss"]
    with open(os.path.join(args.output_dir, "training_log.json"), "w") as f:
        json.dump(log, f, indent=2)
    
    print(f"✅ Training complete! Final loss: {log['final_loss']:.6f}")
    print(f"   Weights: {args.output_dir}")
    print(f"   Log: {args.output_dir}/training_log.json")

if __name__ == "__main__":
    main()
