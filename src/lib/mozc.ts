/** Emoji readings from Mozc (Google Japanese Input) `src/data/emoji/emoji_data.tsv`. */
import { isValidReading, katakanaToHiragana } from "./kana.ts";

const normalizeCode = (code: string) => code.toUpperCase().replace(/ FE0F/g, "");

/** Normalize a Mozc reading to an SKK headword, or undefined if it cannot be one (e.g. "11:30", "upまーく"). */
export function normalizeMozcReading(reading: string): string | undefined {
  const r = katakanaToHiragana(reading.normalize("NFKC")).toLowerCase();
  return isValidReading(r) ? r : undefined;
}

/**
 * Columns: 1) code points 2) emoji 3) space separated readings 4) unicode name
 * 5) Japanese name 6) descriptions 7) emoji version.
 * Returns code points (FE0F removed) -> readings.
 */
export function parseMozcEmojiData(tsv: string): Map<string, string[]> {
  const result = new Map<string, string[]>();
  for (const line of tsv.split("\n")) {
    if (line.startsWith("#") || line.trim() === "") continue;
    const [code, , readings = ""] = line.split("\t");
    if (!code) continue;
    const normalized = readings.split(/\s+/).map(normalizeMozcReading).filter((r): r is string => !!r);
    const key = normalizeCode(code);
    result.set(key, [...new Set([...(result.get(key) ?? []), ...normalized])]);
  }
  return result;
}

export function lookupMozc(readings: Map<string, string[]>, code: string): string[] {
  return readings.get(normalizeCode(code)) ?? [];
}

export const MOZC_NOTICE = `Copyright 2010-2018, Google Inc.
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are
met:

  * Redistributions of source code must retain the above copyright
    notice, this list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above
    copyright notice, this list of conditions and the following disclaimer
    in the documentation and/or other materials provided with the
    distribution.
  * Neither the name of Google Inc. nor the names of its
    contributors may be used to endorse or promote products derived from
    this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
"AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.`;
