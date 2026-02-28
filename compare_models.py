#!/usr/bin/env python3
"""
Generate comparison images: base FLUX vs fine-tuned FLUX.
Produces side-by-side images for the demo.
"""

import subprocess
import os
from PIL import Image

MFLUX = "/Users/loki/.pyenv/versions/3.14.3/bin/mflux-generate"
OUTDIR = "/tmp/sandmantales-hackathon/comparison"

PROMPTS = [
    "A small kitten sleeping under a glowing mushroom in a magical forest, children book illustration, watercolor style",
    "A friendly dragon reading a bedtime story to baby animals, children book illustration, soft warm lighting",
    "A little girl riding a cloud shaped like a unicorn over a sleeping village, dreamy atmosphere, kid-friendly",
]

def generate(prompt, output, seed=42, lora_path=None):
    cmd = [MFLUX, "--model", "schnell", "--prompt", prompt,
           "--width", "512", "--height", "512", "--steps", "2",
           "--seed", str(seed), "--output", output]
    if lora_path:
        cmd.extend(["--lora-paths", lora_path])
    subprocess.run(cmd, capture_output=True)

def main():
    os.makedirs(OUTDIR, exist_ok=True)
    lora_path = "/tmp/sandmantales-hackathon/lora_weights"

    for i, prompt in enumerate(PROMPTS):
        print(f"Prompt {i+1}: {prompt[:60]}...")
        
        # Base model
        base_out = f"{OUTDIR}/prompt_{i}_base.png"
        print(f"  Base FLUX...", end=" ", flush=True)
        generate(prompt, base_out, seed=42+i)
        print("✅")
        
        # Fine-tuned
        lora_out = f"{OUTDIR}/prompt_{i}_lora.png"
        print(f"  LoRA FLUX...", end=" ", flush=True)
        generate(prompt, lora_out, seed=42+i, lora_path=lora_path)
        print("✅")
        
        # Side by side
        base_img = Image.open(base_out)
        lora_img = Image.open(lora_out)
        combined = Image.new("RGB", (1024, 512))
        combined.paste(base_img, (0, 0))
        combined.paste(lora_img, (512, 0))
        combined.save(f"{OUTDIR}/prompt_{i}_comparison.png")
        print(f"  Saved comparison")

    print(f"\n✅ All comparisons in {OUTDIR}/")

if __name__ == "__main__":
    main()
