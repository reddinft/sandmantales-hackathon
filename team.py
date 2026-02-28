#!/usr/bin/env python3
"""
CLI tool for orchestrator agent to communicate with Mistral AI Agents.

Usage: python3 team.py <agent_name> <message>

Agent names and their Mistral Agent IDs:
- pathfinder = ag_019ca24f110677d7a92ec83a5c85704a (story generation specialist)
- firefly = ag_019ca24f601773e1a953fac560ff4d71 (builder/architect)
- lifeline = ag_019ca24f147876f2ab26526f6cf8c4b4 (voice/audio specialist)
"""

import os
import json
import argparse
from mistralai import Mistral

# Agent mapping
AGENTS = {
    "pathfinder": "ag_019ca24f110677d7a92ec83a5c85704a",
    "firefly": "ag_019ca24f601773e1a953fac560ff4d71",
    "lifeline": "ag_019ca24f147876f2ab26526f6cf8c4b4"
}

CONVERSATIONS_FILE = "/tmp/sandmantales-hackathon/.conversations.json"

def load_conversations():
    """Load existing conversations from file."""
    if os.path.exists(CONVERSATIONS_FILE):
        with open(CONVERSATIONS_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_conversations(conversations):
    """Save conversations to file."""
    with open(CONVERSATIONS_FILE, 'w') as f:
        json.dump(conversations, f, indent=2)

def get_agent_id(agent_name):
    """Get agent ID from name."""
    return AGENTS.get(agent_name.lower())

def main():
    parser = argparse.ArgumentParser(description="Communicate with Mistral AI Agents")
    parser.add_argument("agent_name", help="Name of the agent (pathfinder, firefly, lifeline)")
    parser.add_argument("message", help="Message to send to the agent")
    parser.add_argument("--conversation-id", help="Continue an existing conversation")
    args = parser.parse_args()

    # Validate agent name
    agent_id = get_agent_id(args.agent_name)
    if not agent_id:
        print(f"Error: Unknown agent '{args.agent_name}'. Available agents: {', '.join(AGENTS.keys())}")
        return 1

    # Get API key
    api_key = os.environ.get("MISTRAL_API_KEY")
    if not api_key:
        print("Error: MISTRAL_API_KEY environment variable not set")
        return 1

    # Initialize client
    client = Mistral(api_key=api_key)

    try:
        conversations = load_conversations()

        if args.conversation_id:
            # Continue existing conversation
            response = client.beta.conversations.append(
                conversation_id=args.conversation_id,
                inputs=args.message
            )
            conversation_id = args.conversation_id
        else:
            # Start new conversation
            response = client.beta.conversations.start(
                agent_id=agent_id,
                inputs=args.message
            )
            conversation_id = response.conversation_id
            
            # Save conversation ID
            conversations[conversation_id] = {
                "agent": args.agent_name
            }
            save_conversations(conversations)

        # Print response
        if response.outputs and response.outputs[0].content:
            print(response.outputs[0].content)
        else:
            print("Error: No response from agent")
            return 1

        # Print conversation ID for reference
        print(f"\n---\nConversation ID: {conversation_id}")
        return 0

    except Exception as e:
        print(f"Error: {str(e)}")
        return 1

if __name__ == "__main__":
    exit(main())