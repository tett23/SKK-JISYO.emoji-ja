/**
 * Generate SKK dictionaries from the YAML data.
 *
 *   deno task build [--strict] [--data-dir data] [--out-dir dist]
 *   node dist-js/src/build.js ...
 */
import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import process from "node:process";
import { parseArgs } from "node:util";
import { UNICODE_NOTICE } from "./lib/cldr.ts";
import { MOZC_NOTICE } from "./lib/mozc.ts";
import { EMOJI_DATA_NOTICE } from "./lib/shortcode.ts";
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

// License files distributed with the dictionaries (third-party notices are also in the dictionary headers).
await copyFile("LICENSE", join(outDir, "LICENSE"));
await writeFile(
  join(outDir, "LICENSE-Unicode.txt"),
  `The emoji list and the Japanese names in ${EUC} and ${UTF8} are derived from
Unicode data files: emoji-test.txt (https://unicode.org/Public/emoji/) and
CLDR annotations (https://github.com/unicode-org/cldr), which are distributed under the following license.

${UNICODE_NOTICE}
`,
);
await writeFile(
  join(outDir, "LICENSE-Mozc.txt"),
  `Readings in ${EUC} and ${UTF8} ("ime_readings" in the source data) are derived from
Mozc (https://github.com/google/mozc), src/data/emoji/emoji_data.tsv,
which is distributed under the following license (BSD 3-Clause License).

${MOZC_NOTICE}
`,
);
await writeFile(
  join(outDir, "LICENSE-emoji-data.txt"),
  `Emoji shortcodes in ${EUC} and ${UTF8} ("shortcodes" in the source data) are derived from
emoji-data (https://github.com/iamcal/emoji-data), emoji.json,
which is distributed under the following license (MIT License).

${EMOJI_DATA_NOTICE}
`,
);

console.error(
  `Emoji ${meta.unicode_emoji_version}: ${dict.emojiCount} emoji, ${dict.entries.size} readings -> ${outDir}/{${EUC},${UTF8}}`,
);
if (opts.strict && dict.warnings.length > 0) {
  console.error(`${dict.warnings.length} warning(s) in strict mode`);
  process.exit(1);
}
