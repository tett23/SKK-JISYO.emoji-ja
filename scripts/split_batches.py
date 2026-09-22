#!/usr/bin/env python3
"""Split base (non skin-tone) emoji into batch files for translation."""
import json, os, sys
n = int(sys.argv[1]) if len(sys.argv) > 1 else 10
rows = [r for r in json.load(open("data/emoji-all.json")) if not r["skin"]]
os.makedirs("data/batches", exist_ok=True)
size = -(-len(rows) // n)
for i in range(n):
    with open(f"data/batches/in-{i:02d}.jsonl", "w") as f:
        for r in rows[i*size:(i+1)*size]:
            f.write(json.dumps({k: r[k] for k in ("emoji", "en", "ja", "kw", "subgroup")}, ensure_ascii=False) + "\n")
print(size)
