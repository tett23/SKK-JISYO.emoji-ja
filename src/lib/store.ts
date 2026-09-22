/** YAML data store: `data/meta.yaml` and one `data/emoji/NN-group.yaml` per emoji group. */
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Document, isMap, isSeq, parse, visit } from "yaml";

export interface EmojiEntry {
  /** The emoji itself (for readability; `code` is authoritative). */
  emoji: string;
  /** Code points of the fully-qualified sequence, e.g. "1F44B". */
  code: string;
  /** Japanese name shown as the SKK annotation. */
  name: string;
  /** SKK readings, most important first. */
  readings: string[];
  /** Slack-style short names without colons (from iamcal/emoji-data), e.g. "thumbsup". Ranked first for their headword. */
  slack?: string[];
  /** Unicode English name. */
  en: string;
  /** Emoji version the sequence was introduced in. */
  since: string;
  subgroup: string;
  /** CLDR Japanese keywords (reference for adding readings). */
  keywords?: string[];
  /** Skin tone variants (code points), listed after the base emoji. */
  variants?: string[];
  /** Added automatically by `update`; readings need a human review. */
  review?: boolean;
}

export interface GroupData {
  group: string;
  emoji: EmojiEntry[];
}

export interface Meta {
  unicode_emoji_version: string;
  cldr_ref: string;
}

const KEY_ORDER: (keyof EmojiEntry)[] = [
  "emoji",
  "code",
  "name",
  "readings",
  "slack",
  "en",
  "since",
  "subgroup",
  "keywords",
  "variants",
  "review",
];

const FILE_HEADER = ` SKK-JISYO.emoji-ja source data (edit this file, then run the build task).
   name:     annotation shown in SKK (Japanese name; no "/" or ";")
   readings: SKK headwords, most important first (hiragana/ー, digits+hiragana, or lowercase ASCII)
   slack:    Slack-style short names (":thumbsup:" without colons), registered as headwords.
             Refreshed from iamcal/emoji-data; hand-written names are kept only while emoji-data has none
   review:   true if added automatically by the update task; remove after checking the readings
 Other fields are refreshed from Unicode/CLDR by the update task.`;

export function groupSlug(group: string): string {
  return group.toLowerCase().replace(/&/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function loadMeta(dataDir: string): Promise<Meta> {
  return parse(await readFile(join(dataDir, "meta.yaml"), "utf-8")) as Meta;
}

export async function saveMeta(dataDir: string, meta: Meta): Promise<void> {
  await writeFile(join(dataDir, "meta.yaml"), new Document(meta).toString());
}

export async function loadGroups(dataDir: string): Promise<GroupData[]> {
  const dir = join(dataDir, "emoji");
  let files: string[];
  try {
    files = (await readdir(dir)).filter((f) => f.endsWith(".yaml")).sort();
  } catch {
    return [];
  }
  const groups: GroupData[] = [];
  for (const f of files) {
    const data = parse(await readFile(join(dir, f), "utf-8")) as GroupData;
    for (const e of data.emoji) {
      e.readings = (e.readings ?? []).map(String);
      e.since = String(e.since);
    }
    groups.push(data);
  }
  return groups;
}

function toYaml(group: GroupData): string {
  const emoji = group.emoji.map((e) => {
    const o: Record<string, unknown> = {};
    for (const k of KEY_ORDER) {
      const v = e[k];
      if (v === undefined || (Array.isArray(v) && v.length === 0 && k !== "readings")) continue;
      o[k] = v;
    }
    return o;
  });
  const doc = new Document({ group: group.group, emoji });
  doc.commentBefore = FILE_HEADER;
  visit(doc, {
    Pair(_, pair) {
      const key = (pair.key as { value?: unknown })?.value;
      if ((key === "keywords" || key === "variants" || key === "slack") && isSeq(pair.value)) pair.value.flow = true;
    },
    Map(_, map) {
      if (isMap(map)) map.flow = false;
    },
  });
  return doc.toString({ lineWidth: 0 });
}

export async function saveGroups(dataDir: string, groups: GroupData[]): Promise<void> {
  const dir = join(dataDir, "emoji");
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  for (const [i, g] of groups.entries()) {
    const file = `${String(i + 1).padStart(2, "0")}-${groupSlug(g.group)}.yaml`;
    await writeFile(join(dir, file), toYaml(g));
  }
}
