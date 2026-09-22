/** Build SKK dictionary text from the YAML data. */
import { codeToEmoji, skinToneLabel } from "./emoji-test.ts";
import { compareBytes, encodeEucJp, isEucJpEncodable } from "./eucjp.ts";
import { expandVu, isValidReading } from "./kana.ts";
import type { GroupData, Meta } from "./store.ts";

export interface Candidate {
  emoji: string;
  annotation: string;
}

interface Hit {
  rank: number;
  order: number;
  base: Candidate;
  variants: Candidate[];
}

export interface Dictionary {
  /** reading -> candidates in display order */
  entries: Map<string, Candidate[]>;
  emojiCount: number;
  warnings: string[];
}

function sanitizeAnnotation(s: string): string {
  return s.replaceAll("/", "／").replaceAll(";", "；");
}

export function collect(groups: GroupData[]): Dictionary {
  const warnings: string[] = [];
  const hits = new Map<string, Hit[]>();
  let order = 0;
  let emojiCount = 0;
  for (const group of groups) {
    for (const e of group.emoji) {
      const name = sanitizeAnnotation(e.name);
      const base = { emoji: codeToEmoji(e.code), annotation: name };
      const variants = (e.variants ?? []).map((code) => ({
        emoji: codeToEmoji(code),
        annotation: `${name}（${skinToneLabel(code)}）`,
      }));
      emojiCount += 1 + variants.length;
      if (e.review) warnings.push(`needs review: ${base.emoji} ${e.code} ${e.en}`);
      const readings: string[] = [];
      for (const raw of e.readings) {
        const r = raw.trim();
        if (!isValidReading(r)) {
          warnings.push(`invalid reading ${JSON.stringify(r)}: ${base.emoji} ${e.code} ${e.en}`);
          continue;
        }
        for (const v of expandVu(r)) if (!readings.includes(v)) readings.push(v);
      }
      if (readings.length === 0) warnings.push(`no readings: ${base.emoji} ${e.code} ${e.en}`);
      readings.forEach((r, rank) => {
        const list = hits.get(r) ?? [];
        list.push({ rank, order, base, variants });
        hits.set(r, list);
      });
      order++;
    }
  }
  const entries = new Map<string, Candidate[]>();
  for (const [reading, list] of hits) {
    list.sort((a, b) => a.rank - b.rank || a.order - b.order);
    entries.set(reading, [...list.map((h) => h.base), ...list.flatMap((h) => h.variants)]);
  }
  return { entries, emojiCount, warnings };
}

/** Emacs Lisp form that evaluates to the emoji, for EUC-JP dictionaries. */
export function lispCandidate(emoji: string): string {
  let body = "";
  for (const c of emoji) {
    const cp = c.codePointAt(0)!;
    if (/^[0-9A-Za-z]$/.test(c)) body += c;
    else if (cp <= 0xffff) body += `\\u${cp.toString(16).toUpperCase().padStart(4, "0")}`;
    else body += `\\U${cp.toString(16).toUpperCase().padStart(8, "0")}`;
  }
  return `(concat "${body}")`;
}

function header(meta: Meta, dict: Dictionary, file: string, coding: string, note: string): string {
  return `;; -*- mode: fundamental; coding: ${coding} -*-
;; ${file} --- Japanese emoji dictionary for SKK
;;
;; Unicode Emoji ${meta.unicode_emoji_version} (${dict.emojiCount} emoji) with Japanese readings.
;; Names are based on Unicode CLDR Japanese annotations.
;; ${note}
;;
;; Copyright (c) 2026 はちがつうまれ
;; Released under the MIT License.
;; Emoji data: Unicode, Inc. (https://www.unicode.org/terms_of_use.html)
;;
;; okuri-ari entries.
;; okuri-nasi entries.
`;
}

export function renderUtf8(meta: Meta, dict: Dictionary, file: string): Uint8Array {
  const enc = new TextEncoder();
  const lines = [...dict.entries.keys()]
    .map((r) => ({ r, key: enc.encode(r) }))
    .sort((a, b) => compareBytes(a.key, b.key))
    .map(({ r }) => `${r} /${dict.entries.get(r)!.map((c) => `${c.emoji};${c.annotation}`).join("/")}/`);
  return enc.encode(header(meta, dict, file, "utf-8", "UTF-8 version.") + lines.join("\n") + "\n");
}

export function renderEucJp(meta: Meta, dict: Dictionary, file: string): Uint8Array {
  const lines = [...dict.entries.keys()]
    .filter(isEucJpEncodable)
    .map((r) => ({ r, key: encodeEucJp(r) }))
    .sort((a, b) => compareBytes(a.key, b.key))
    .map(({ r }) => `${r} /${dict.entries.get(r)!.map((c) => `${lispCandidate(c.emoji)};${c.annotation}`).join("/")}/`);
  const note = `EUC-JP version: emoji are written as Emacs Lisp (concat "\\UXXXXXXXX") forms.`;
  return encodeEucJp(header(meta, dict, file, "euc-jp", note) + lines.join("\n") + "\n");
}
