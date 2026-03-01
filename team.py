#!/usr/bin/env python3
"""
CLI tool for orchestrator agent to communicate with Mistral AI Agents.

Usage: python3 team.py <agent_name> <message>

Agent names and their Mistral Agent IDs:
- papa_bois  = ag_019ca24ec2c271458172692e54fc0c94 (orchestrator, Trinidad mythology)
- anansi     = ag_019ca24f110677d7a92ec83a5c85704a (storyteller, West African mythology)
- firefly    = ag_019ca24f601773e1a953fac560ff4d71 (builder/assembler)
- devi       = ag_019ca24f147876f2ab26526f6cf8c4b4 (voice/audio specialist, Hindu mythology)
- ogma       = None (language guardian, Celtic mythology — Mistral Agent pending)
"""

import os
import json
import argparse
from mistralai import Mistral

# Agent mapping
AGENTS = {
    "papa_bois": "ag_019ca24ec2c271458172692e54fc0c94",
    "anansi": "ag_019ca24f110677d7a92ec83a5c85704a",
    "firefly": "ag_019ca24f601773e1a953fac560ff4d71",
    "devi": "ag_019ca24f147876f2ab26526f6cf8c4b4",
    "ogma": None,
}

CONVERSATIONS_FILE = "/tmp/sandmantales-hackathon/.conversations.json"

def load_conversations():
    if os.path.exists(CONVERSATIONS_FILE):
        with open(CONVERSATIONS_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_conversations(conversations):
    with open(CONVERSATIONS_FILE, 'w') as f:
        json.dump(conversations, f, indent=2)

def get_agent_id(agent_name):
    return AGENTS.get(agent_name.lower())

def main():
    parser = argparse.ArgumentParser(description="Communicate with Mistral AI Agents")
    parser.add_argument("agent_name", help="Name of the agent (papa_bois, anansi, firefly, devi, ogma)")
    parser.add_argument("message", help="Message to send to the agent")
    parser.add_argument("--conversation-id", help="Continue an existing conversation")
    args = parser.parse_args()

    if args.agent_name.lower() not in AGENTS:
        print(f"Error: Unknown agent '{args.agent_name}'. Available agents: {', '.join(AGENTS.keys())}")
        return 1

    agent_id = get_agent_id(args.agent_name)
    if not agent_id:
        print(f"Error: Agent '{args.agent_name}' has no Mistral Agent ID configured yet")
        return 1

    api_key = os.environ.get("MISTRAL_API_KEY")
    if not api_key:
        print("Error: MISTRAL_API_KEY environment variable not set")
        return 1

    client = Mistral(api_key=api_key)

    try:
        conversations = load_conversations()

        if args.conversation_id:
            response = client.beta.conversations.append(
                conversation_id=args.conversation_id,
                inputs=args.message
            )
            conversation_id = args.conversation_id
        else:
            response = client.beta.conversations.start(
                agent_id=agent_id,
                inputs=args.message
            )
            conversation_id = response.conversation_id
            conversations[conversation_id] = {"agent": args.agent_name}
            save_conversations(conversations)

        if not response.outputs:
            print("Error: No response from agent")
            return 1
        
        output = response.outputs[0]
        output_type = type(output).__name__
        
        if output_type == 'FunctionCallEntry':
            args_data = output.arguments
            if isinstance(args_data, dict):
                print(json.dumps(args_data, indent=2, ensure_ascii=False))
            else:
                print(str(args_data))
        elif hasattr(output, 'content') and output.content:
            print(output.content)
        else:
            print("Error: No usable response from agent")
            return 1

        print(f"\n---\nConversation ID: {conversation_id}")
        return 0

    except Exception as e:
        print(f"Error: {str(e)}")
        return 1

if __name__ == "__main__":
    exit(main())
