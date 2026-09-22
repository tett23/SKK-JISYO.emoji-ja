/** Parser for Unicode `emoji-test.txt`. */

export const SKIN_TONES: ReadonlyMap<number, string> = new Map([
  [0x1f3fb, "薄い肌色"],
  [0x1f3fc, "やや薄い肌色"],
  [0x1f3fd, "中間の肌色"],
  [0x1f3fe, "やや濃い肌色"],
  [0x1f3ff, "濃い肌色"],
]);

export interface EmojiTestEntry {
  code: string; // "1F44B 1F3FB"
  emoji: string;
  status: "fully-qualified" | "component";
  since: string; // emoji version the sequence was added in
  en: string;
  group: string;
  subgroup: string;
  /** true when the sequence contains a skin tone modifier applied to another emoji. */
  skinVariant: boolean;
}

export interface EmojiTest {
  version: string;
  entries: EmojiTestEntry[];
}

const LINE = /^([0-9A-F ]+?)\s*;\s*(fully-qualified|component)\s*#\s*\S+\s+E(\d+\.\d+)\s+(.*)$/;

export function codeToEmoji(code: string): string {
  return String.fromCodePoint(...code.split(" ").map((c) => parseInt(c, 16)));
}

export function parseEmojiTest(text: string): EmojiTest {
  const version = /^# Version: (\S+)/m.exec(text)?.[1];
  if (!version) throw new Error("emoji-test.txt: version header not found");
  const entries: EmojiTestEntry[] = [];
  let group = "";
  let subgroup = "";
  for (const line of text.split("\n")) {
    if (line.startsWith("# group:")) {
      group = line.slice(8).trim();
      continue;
    }
    if (line.startsWith("# subgroup:")) {
      subgroup = line.slice(11).trim();
      continue;
    }
    const m = LINE.exec(line);
    if (!m) continue;
    const [, code, status, since, en] = m as unknown as [string, string, EmojiTestEntry["status"], string, string];
    const cps = code.split(" ");
    entries.push({
      code,
      emoji: codeToEmoji(code),
      status,
      since,
      en,
      group,
      subgroup,
      skinVariant: cps.length > 1 && cps.some((c) => SKIN_TONES.has(parseInt(c, 16))),
    });
  }
  return { version, entries };
}

/** Skin tone names contained in a sequence, e.g. "薄い肌色・濃い肌色". */
export function skinToneLabel(code: string): string {
  return code.split(" ")
    .map((c) => SKIN_TONES.get(parseInt(c, 16)))
    .filter((t): t is string => t !== undefined)
    .join("・");
}
