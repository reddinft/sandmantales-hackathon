#!/usr/bin/env python3
"""
Log LoRA training results to Weights & Biases for the hackathon.
Run after training completes.

Usage: python3 log_to_wandb.py --log ./lora_weights/training_log.json
"""

import json
import argparse
import os

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--log", default="./lora_weights/training_log.json")
    parser.add_argument("--project", default="sandmantales-flux-lora")
    parser.add_argument("--name", default="storybook-style-lora")
    args = parser.parse_args()

    try:
        import wandb
    except ImportError:
        print("❌ wandb not installed. Run: pip install wandb")
        return

    with open(args.log) as f:
        log = json.load(f)

    run = wandb.init(
        project=args.project,
        name=args.name,
        config=log["config"],
    )

    # Log training losses
    for entry in log["losses"]:
        wandb.log({"loss": entry["loss"], "step": entry["step"]})

    # Log summary
    wandb.summary["final_loss"] = log["final_loss"]
    wandb.summary["total_steps"] = log["config"]["steps"]
    wandb.summary["lora_rank"] = log["config"]["rank"]
    wandb.summary["training_images"] = 20
    wandb.summary["style"] = "storybook-watercolor-kid-friendly"

    # Log sample images if they exist
    lora_dir = os.path.dirname(args.log)
    samples_dir = os.path.join(lora_dir, "samples")
    if os.path.exists(samples_dir):
        images = []
        for f in sorted(os.listdir(samples_dir)):
            if f.endswith(".png"):
                images.append(wandb.Image(os.path.join(samples_dir, f), caption=f))
        if images:
            wandb.log({"generated_samples": images})

    run.finish()
    print(f"✅ Logged to W&B: {args.project}/{args.name}")

if __name__ == "__main__":
    main()
