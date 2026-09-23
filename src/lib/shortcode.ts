/** Emoji shortcodes (e.g. "thumbsup" for `:thumbsup:`) from iamcal/emoji-data `emoji.json`. */

interface EmojiDataEntry {
  unified: string; // "1F44D" / "2764-FE0F"
  non_qualified?: string | null;
  short_names: string[];
}

/** Valid shortcode headword (used without the surrounding colons). */
export const VALID_SHORTCODE = /^[a-z0-9_+-]+$/;

const normalize = (code: string) => code.toUpperCase().replaceAll("-", " ").replace(/ FE0F/g, "");

/** code points (FE0F removed) -> short names */
export function parseEmojiData(json: string): Map<string, string[]> {
  const result = new Map<string, string[]>();
  for (const e of JSON.parse(json) as EmojiDataEntry[]) {
    result.set(normalize(e.unified), e.short_names);
    if (e.non_qualified) result.set(normalize(e.non_qualified), e.short_names);
  }
  return result;
}

export function lookupShortcodes(names: Map<string, string[]>, code: string): string[] {
  return names.get(normalize(code)) ?? [];
}

export const EMOJI_DATA_NOTICE = `The MIT License (MIT)

Copyright (c) 2013 Cal Henderson

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;
