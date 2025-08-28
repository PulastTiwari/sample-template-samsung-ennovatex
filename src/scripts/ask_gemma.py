#!/usr/bin/env python3
import requests
import json

my_prompt = "Why is the sky blue?"
url = "http://localhost:11434/api/generate"

data = {
    "model": "gemma:2b",
    "prompt": my_prompt,
    "stream": False
}

resp = requests.post(url, json=data)
if resp.status_code == 200:
    d = resp.json()
    print("🤖 Gemma's Answer:")
    # The exact shape may vary depending on Ollama version
    print(json.dumps(d, indent=2))
else:
    print(f"Error: {resp.status_code} - {resp.text}")
