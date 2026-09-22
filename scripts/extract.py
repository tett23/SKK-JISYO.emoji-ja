#!/usr/bin/env python3
"""Merge Unicode emoji-test.txt with CLDR ja annotations into data/emoji-base.tsv."""
import re, sys, json, xml.etree.ElementTree as ET

src = sys.argv[1] if len(sys.argv) > 1 else "data"
SKIN = {"1F3FB", "1F3FC", "1F3FD", "1F3FE", "1F3FF"}

def load(path):
    names, kws = {}, {}
    for a in ET.parse(path).getroot().iter("annotation"):
        cp = a.get("cp")
        if a.get("type") == "tts":
            names[cp] = a.text
        else:
            kws[cp] = [k.strip() for k in a.text.split("|")]
    return names, kws

n1, k1 = load(f"{src}/annotations-ja.xml")
n2, k2 = load(f"{src}/annotationsDerived-ja.xml")
names = {**n2, **n1}; kws = {**k2, **k1}

rows = []
group = sub = ""
for line in open(f"{src}/emoji-test.txt", encoding="utf-8"):
    if line.startswith("# group:"): group = line.split(":", 1)[1].strip(); continue
    if line.startswith("# subgroup:"): sub = line.split(":", 1)[1].strip(); continue
    m = re.match(r"^([0-9A-F ]+?)\s*;\s*(fully-qualified|component)\s*#\s*(\S+)\s+E(\d+\.\d+)\s+(.*)$", line)
    if not m: continue
    cps, status, emoji, ver, en = m.groups()
    cpl = cps.split()
    has_skin = any(c in SKIN for c in cpl) and len(cpl) > 1
    key = emoji
    ja = names.get(key) or names.get(key.replace("️", ""))
    kw = kws.get(key) or kws.get(key.replace("️", "")) or []
    rows.append(dict(emoji=emoji, cps=cps, status=status, ver=ver, en=en, group=group,
                     subgroup=sub, skin=has_skin, ja=ja, kw=kw))

json.dump(rows, open("data/emoji-all.json", "w"), ensure_ascii=False, indent=0)
base = [r for r in rows if not r["skin"]]
print("total", len(rows), "base(no skin)", len(base), "missing ja", sum(1 for r in rows if not r["ja"]))
for r in rows:
    if not r["ja"]: print("MISSING", r["emoji"], r["cps"], r["en"])
