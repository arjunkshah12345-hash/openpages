from pathlib import Path
import os

keys = [
    "SUPERCOMPRESS_API_KEY",
    "OPENAI_API_KEY",
    "ANTHROPIC_API_KEY",
    "GOOGLE_API_KEY",
    "OPENROUTER_API_KEY",
    "AI_GATEWAY_API_KEY",
]

found = {}
for k in keys:
    found[k] = None
    if os.environ.get(k):
        found[k] = "env"
        continue
    for name in [".env", ".env.local", ".env.production.local"]:
        p = Path(name)
        if not p.exists():
            continue
        for line in p.read_text().splitlines():
            if line.startswith(k + "="):
                v = line.split("=", 1)[1].strip().strip("\"'")
                if v:
                    found[k] = name
                    break
        if found[k]:
            break

for k, src in found.items():
    print(f"{k}: {src or 'missing'}")
