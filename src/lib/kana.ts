/** Reading (SKK midashi) helpers. */

/** Valid okuri-nasi headword: hiragana (optionally prefixed by digits) or lowercase ASCII/digits. */
export const VALID_READING = /^(?:[0-9]*[ぁ-ゖー]+|[a-z0-9]+)$/;

export function isValidReading(s: string): boolean {
  return VALID_READING.test(s);
}

export function katakanaToHiragana(s: string): string {
  return s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
}

/** Convert a kana-only word (katakana/hiragana) to a reading, or undefined if it contains kanji etc. */
export function kanaToReading(s: string): string | undefined {
  const r = katakanaToHiragana(s.replace(/[・\s]/g, ""));
  return /^[ぁ-ゖー]+$/.test(r) ? r : undefined;
}

/** ゔ is not in EUC-JP and is often typed as ぶ; return the reading plus its ぶ-form. */
export function expandVu(reading: string): string[] {
  if (!reading.includes("ゔ")) return [reading];
  const alt = reading
    .replaceAll("ゔぁ", "ば").replaceAll("ゔぃ", "び").replaceAll("ゔぇ", "べ").replaceAll("ゔぉ", "ぼ")
    .replaceAll("ゔ", "ぶ");
  return [reading, alt];
}
