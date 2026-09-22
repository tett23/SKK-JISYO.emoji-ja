#!/usr/bin/env python3
"""Build SKK-JISYO.emoji-ja (UTF-8) and SKK-JISYO.emoji-ja.euc (EUC-JP) from data/."""
import glob, json, re, sys
from collections import OrderedDict

SKIN = {0x1F3FB: "薄い肌色", 0x1F3FC: "やや薄い肌色", 0x1F3FD: "中間の肌色",
        0x1F3FE: "やや濃い肌色", 0x1F3FF: "濃い肌色"}
VALID = re.compile(r"^(?:[0-9]*[ぁ-ゖー]+|[a-z0-9]+)$")
EUC_FIX = str.maketrans({"～": "〜", "−": "－", "‐": "－", "･": "・"})

rows = json.load(open("data/emoji-all.json"))
out = {}
for path in sorted(glob.glob("data/batches/out-*.jsonl")):
    for line in open(path, encoding="utf-8"):
        if line.strip():
            o = json.loads(line)
            out[o["emoji"]] = o

errors = []
entries = OrderedDict()  # emoji -> {name, readings, variants}
base = None
for r in rows:
    if r["skin"]:
        tones = "・".join(SKIN[int(c, 16)] for c in r["cps"].split() if int(c, 16) in SKIN)
        entries[base]["variants"].append((r["emoji"], f"{entries[base]['name']}（{tones}）"))
        continue
    base = r["emoji"]
    o = out.get(base)
    if o is None:
        errors.append(f"missing translation: {base} {r['en']}")
        o = {"name": r["ja"], "readings": []}
    name = o["name"].replace("/", "／").replace(";", "；")
    readings = []
    for y in o["readings"]:
        y = y.strip()
        if not VALID.match(y):
            errors.append(f"invalid reading {y!r} for {base} {r['en']}")
        else:
            # ゔ is not in EUC-JP and many people type ぶ anyway
            for v in (y, y.replace("ゔぁ", "ば").replace("ゔぃ", "び").replace("ゔぇ", "べ").replace("ゔぉ", "ぼ").replace("ゔ", "ぶ")):
                if v not in readings:
                    readings.append(v)
    entries[base] = {"name": name, "readings": readings, "variants": []}

# reading -> [(rank, order, emoji, annotation)]
table = {}
for order, (emoji, e) in enumerate(entries.items()):
    for rank, y in enumerate(e["readings"]):
        table.setdefault(y, []).append((rank, order, emoji, e["name"], e["variants"]))

def candidates(y):
    items = sorted(table[y], key=lambda t: (t[0], t[1]))
    cands = [(emoji, name) for _, _, emoji, name, _ in items]
    for *_, variants in items:
        cands.extend(variants)
    return cands

def lisp_string(s):
    return '(concat "' + "".join(
        c if c.isascii() and c.isalnum() else
        (f"\\u{ord(c):04X}" if ord(c) <= 0xFFFF else f"\\U{ord(c):08X}") for c in s) + '")'

def euc_annotation(a):
    a = a.translate(EUC_FIX)
    return "".join(c if _encodable(c) else "?" for c in a)

def _ok(s, enc):
    try:
        s.encode(enc); return True
    except UnicodeEncodeError:
        return False

def _encodable(c):
    try:
        c.encode("euc_jp"); return True
    except UnicodeEncodeError:
        return False

header = """;; -*- mode: fundamental; coding: {coding} -*-
;; SKK-JISYO.emoji-ja{suffix} --- Japanese emoji dictionary for SKK
;;
;; Unicode Emoji {ver} ({count} emoji) with Japanese readings.
;; Names are based on Unicode CLDR Japanese annotations.
;; {note}
;;
;; Copyright (c) 2026 はちがつうまれ
;; Released under the MIT License.
;; Emoji data: Unicode, Inc. (https://www.unicode.org/terms_of_use.html)
;;
;; okuri-ari entries.
;; okuri-nasi entries.
"""

ver = re.search(r"# Version: (\S+)", open("data/emoji-test.txt", encoding="utf-8").read()).group(1)

def build(coding, suffix, fmt_cand, fmt_ann, enc, sortkey, note):
    lines = []
    for y in sorted(filter(lambda y: _ok(y, enc), table), key=sortkey):
        cs = "".join(f"/{fmt_cand(e)};{fmt_ann(a)}" for e, a in candidates(y))
        lines.append(f"{y} {cs}/")
    text = header.format(coding=coding, suffix=suffix, ver=ver, count=len(rows), note=note) + "\n".join(lines) + "\n"
    with open(f"SKK-JISYO.emoji-ja{suffix}", "w", encoding=enc, newline="\n") as f:
        f.write(text)
    return len(lines)

n = build("utf-8", ".utf8", lambda e: e, lambda a: a, "utf-8",
          lambda y: y.encode("utf-8"), "UTF-8 version.")
build("euc-jp", "", lisp_string, euc_annotation, "euc_jp",
      lambda y: y.encode("euc_jp"),
      "EUC-JP version: emoji are written as Emacs Lisp (concat \"\\UXXXXXXXX\") forms.")
print(f"readings: {n}, emoji: {len(rows)}, errors: {len(errors)}")
for e in errors: print("  " + e, file=sys.stderr)
