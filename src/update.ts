/**
 * Fetch the latest Unicode emoji list and CLDR Japanese annotations,
 * and merge them into the YAML data (existing names/readings are kept).
 *
 *   deno task update [--offline] [--cldr-ref <git ref>] [--emoji-url <url>] [--data-dir data]
 *   node dist-js/src/update.js ...
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import process from "node:process";
import { parseArgs } from "node:util";
import { lookup, parseAnnotations } from "./lib/cldr.ts";
import { parseEmojiTest } from "./lib/emoji-test.ts";
import { kanaToReading } from "./lib/kana.ts";
import { type EmojiEntry, type GroupData, loadGroups, loadMeta, saveGroups, saveMeta } from "./lib/store.ts";

const { values: opts } = parseArgs({
  args: process.argv.slice(2),
  options: {
    "data-dir": { type: "string", default: "data" },
    "offline": { type: "boolean", default: false },
    "cldr-ref": { type: "string" },
    "emoji-url": { type: "string", default: "https://unicode.org/Public/emoji/latest/emoji-test.txt" },
  },
});
const dataDir = opts["data-dir"]!;
const sourceDir = join(dataDir, "sources");
const cldrRef = opts["cldr-ref"] ?? (await loadMeta(dataDir).catch(() => undefined))?.cldr_ref ?? "main";

async function source(file: string, url: string): Promise<string> {
  const path = join(sourceDir, file);
  if (opts.offline) return await readFile(path, "utf-8");
  console.error(`fetch ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  const text = await res.text();
  await mkdir(sourceDir, { recursive: true });
  await writeFile(path, text);
  return text;
}

const cldrBase = `https://raw.githubusercontent.com/unicode-org/cldr/${cldrRef}/common`;
const emojiTest = parseEmojiTest(await source("emoji-test.txt", opts["emoji-url"]!));
const annotations = parseAnnotations(
  await source("annotationsDerived-ja.xml", `${cldrBase}/annotationsDerived/ja.xml`),
  await source("annotations-ja.xml", `${cldrBase}/annotations/ja.xml`),
);

const existing = new Map<string, EmojiEntry>();
const existingGroup = new Map<string, string>();
for (const g of await loadGroups(dataDir)) {
  for (const e of g.emoji) {
    existing.set(e.code, e);
    existingGroup.set(e.code, g.group);
  }
}

function seedReadings(name: string | undefined, keywords: string[]): string[] {
  const seeds = [name, ...keywords].map((w) => w && kanaToReading(w)).filter((r): r is string => !!r);
  return [...new Set(seeds)];
}

const groups: GroupData[] = [];
const seen = new Set<string>();
let added = 0;
let base: EmojiEntry | undefined;
for (const t of emojiTest.entries) {
  if (t.skinVariant) {
    if (!base) throw new Error(`skin tone variant without base: ${t.code}`);
    base.variants!.push(t.code);
    continue;
  }
  let group = groups.at(-1);
  if (group?.group !== t.group) groups.push(group = { group: t.group, emoji: [] });
  const cldr = lookup(annotations, t.emoji);
  const keywords = cldr?.keywords ?? [];
  const old = existing.get(t.code);
  base = {
    emoji: t.emoji,
    code: t.code,
    name: old?.name ?? cldr?.name ?? t.en,
    readings: old?.readings ?? seedReadings(cldr?.name, keywords),
    en: t.en,
    since: t.since,
    subgroup: t.subgroup,
    keywords,
    variants: [],
    review: old ? old.review : true,
  };
  if (!old) {
    added++;
    console.error(`new: ${t.emoji} ${t.code} ${t.en} (${base.name}) readings: ${base.readings.join(" ") || "-"}`);
  }
  seen.add(t.code);
  group.emoji.push(base);
}

for (const [code, e] of existing) {
  if (seen.has(code)) continue;
  console.error(`warning: not in emoji-test.txt any more, kept: ${e.emoji} ${code} ${e.en}`);
  const g = groups.find((g) => g.group === existingGroup.get(code));
  if (g) g.emoji.push(e);
  else groups.push({ group: existingGroup.get(code)!, emoji: [e] });
}

await saveGroups(dataDir, groups);
await saveMeta(dataDir, { unicode_emoji_version: emojiTest.version, cldr_ref: cldrRef });
const total = groups.reduce((n, g) => n + g.emoji.length, 0);
console.error(`Emoji ${emojiTest.version}: ${total} base emoji, ${added} added`);
if (added > 0) console.error(`Review entries marked "review: true" in ${join(dataDir, "emoji")}/*.yaml`);
