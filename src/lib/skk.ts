/** Build SKK dictionary text from the YAML data. */
import { codeToEmoji, skinToneLabel } from "./emoji-test.ts";
import { compareBytes, encodeEucJp, isEucJpEncodable } from "./eucjp.ts";
import { expandVu, isValidReading } from "./kana.ts";
import { UNICODE_NOTICE } from "./cldr.ts";
import { MOZC_NOTICE } from "./mozc.ts";
import { EMOJI_DATA_NOTICE, VALID_SHORTCODE } from "./shortcode.ts";
import type { GroupData, Meta } from "./store.ts";

export interface Candidate {
  emoji: string;
  annotation: string;
}

const IME_RANK = Number.MAX_SAFE_INTEGER;

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
      const shortcodes = (e.shortcodes ?? []).filter((s) => {
        const ok = VALID_SHORTCODE.test(s);
        if (!ok) warnings.push(`invalid shortcode ${JSON.stringify(s)}: ${base.emoji} ${e.code} ${e.en}`);
        return ok;
      });
      // A shortcode identifies exactly one emoji, so it outranks every reading.
      // IME readings are unordered and often generic ("かお"), so they rank after every curated reading.
      const headwords = new Map<string, number>(readings.map((r, rank) => [r, rank]));
      for (const raw of e.ime_readings ?? []) {
        if (!isValidReading(raw)) {
          warnings.push(`invalid ime reading ${JSON.stringify(raw)}: ${base.emoji} ${e.code} ${e.en}`);
          continue;
        }
        for (const v of expandVu(raw)) if (!headwords.has(v)) headwords.set(v, IME_RANK);
      }
      for (const s of shortcodes) headwords.set(s, -1);
      for (const [r, rank] of headwords) {
        const list = hits.get(r) ?? [];
        list.push({ rank, order, base, variants });
        hits.set(r, list);
      }
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

/** Marker that lists only this dictionary's candidates (shared with SKK-JISYO.kaomoji). */
export const BANG = "!";

/**
 * Add a "!"-prefixed copy of every headword with the same candidates (ADR 0002).
 * Other dictionaries have no headword with "!" followed by a reading, so "!" + reading lists only emoji.
 */
export function withBangHeadwords(dict: Dictionary): Dictionary {
  const entries = new Map(dict.entries);
  for (const [reading, candidates] of dict.entries) entries.set(BANG + reading, candidates);
  return { ...dict, entries };
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

/** One candidate of an EUC-JP line (without the separating "/"). */
function eucCandidate(c: Candidate): string {
  return `${lispCandidate(c.emoji)};${c.annotation}`;
}

const charLength = (s: string) => [...s].length;

/**
 * Characters of the EUC-JP dictionary line for a headword, without the newline.
 * DDSKK measures its binary search in characters of the decoded buffer (ADR 0003).
 */
export function eucLineLength(headword: string, candidates: Candidate[]): number {
  return charLength(headword) + 2 + candidates.reduce((n, c) => n + charLength(eucCandidate(c)) + 1, 0);
}

/**
 * Longest EUC-JP line, in characters. DDSKK's binary search (limit 10000) misses
 * headwords after a line of 5000 characters or more (ADR 0003).
 */
export const MAX_LINE_LENGTH = 4000;

/**
 * Drop candidates from the end of lines longer than `max` (measured with the "!" prefix),
 * keeping every emoji in at least one line. Headwords are processed in UTF-8 byte order.
 */
export function limitLineLength(dict: Dictionary, max: number): Dictionary {
  const occurrences = new Map<string, number>();
  for (const candidates of dict.entries.values()) {
    for (const c of candidates) occurrences.set(c.emoji, (occurrences.get(c.emoji) ?? 0) + 1);
  }
  const enc = new TextEncoder();
  const limited = new Map<string, Candidate[]>();
  const byBytes = [...dict.entries.keys()]
    .map((r) => ({ r, key: enc.encode(r) }))
    .sort((a, b) => compareBytes(a.key, b.key));
  for (const { r } of byBytes) {
    const kept = [...dict.entries.get(r)!];
    let length = eucLineLength(BANG + r, kept);
    for (let i = kept.length - 1; i >= 0 && length > max; i--) {
      const c = kept[i]!;
      const n = occurrences.get(c.emoji)!;
      if (n <= 1) continue; // the only line left for this emoji
      occurrences.set(c.emoji, n - 1);
      kept.splice(i, 1);
      length -= charLength(eucCandidate(c)) + 1;
    }
    if (length > max) {
      throw new Error(
        `the line for "${r}" is ${length} characters, longer than ${max}, even after dropping candidates`,
      );
    }
    limited.set(r, kept);
  }
  return { ...dict, entries: new Map([...dict.entries.keys()].map((r) => [r, limited.get(r)!])) };
}

function commentLines(text: string): string {
  return text.split("\n").map((l) => `;; ${l}`.trimEnd()).join("\n");
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
;;
;; The emoji list (emoji-test.txt) and Japanese names and keywords (CLDR annotations)
;; are Unicode data files, distributed under the following license:
;;
${commentLines(UNICODE_NOTICE)}
;;
;; Some readings are taken from Mozc (https://github.com/google/mozc),
;; src/data/emoji/emoji_data.tsv, distributed under the following license:
;;
${commentLines(MOZC_NOTICE)}
;;
;; Emoji shortcodes are taken from emoji-data (https://github.com/iamcal/emoji-data),
;; emoji.json, distributed under the following license:
;;
${commentLines(EMOJI_DATA_NOTICE)}
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
    .map(({ r }) => `${r} /${dict.entries.get(r)!.map(eucCandidate).join("/")}/`);
  const note = `EUC-JP version: emoji are written as Emacs Lisp (concat "\\UXXXXXXXX") forms.`;
  return encodeEucJp(header(meta, dict, file, "euc-jp", note) + lines.join("\n") + "\n");
}
