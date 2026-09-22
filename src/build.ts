/**
 * Generate SKK dictionaries from the YAML data.
 *
 *   deno task build [--strict] [--data-dir data] [--out-dir dist]
 *   node dist-js/src/build.js ...
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import process from "node:process";
import { parseArgs } from "node:util";
import { collect, renderEucJp, renderUtf8 } from "./lib/skk.ts";
import { loadGroups, loadMeta } from "./lib/store.ts";

const { values: opts } = parseArgs({
  args: process.argv.slice(2),
  options: {
    "data-dir": { type: "string", default: "data" },
    "out-dir": { type: "string", default: "dist" },
    "strict": { type: "boolean", default: false },
  },
});
const dataDir = opts["data-dir"]!;
const outDir = opts["out-dir"]!;

const meta = await loadMeta(dataDir);
const dict = collect(await loadGroups(dataDir));
for (const w of dict.warnings) console.error(`warning: ${w}`);

const EUC = "SKK-JISYO.emoji-ja";
const UTF8 = "SKK-JISYO.emoji-ja.utf8";
await mkdir(outDir, { recursive: true });
await writeFile(join(outDir, EUC), renderEucJp(meta, dict, EUC));
await writeFile(join(outDir, UTF8), renderUtf8(meta, dict, UTF8));
console.error(
  `Emoji ${meta.unicode_emoji_version}: ${dict.emojiCount} emoji, ${dict.entries.size} readings -> ${outDir}/{${EUC},${UTF8}}`,
);
if (opts.strict && dict.warnings.length > 0) {
  console.error(`${dict.warnings.length} warning(s) in strict mode`);
  process.exit(1);
}
