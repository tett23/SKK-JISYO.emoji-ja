import assert from "node:assert/strict";
import { test } from "node:test";
import { codeToEmoji } from "../src/lib/emoji-test.ts";
import { collect } from "../src/lib/skk.ts";
import { loadGroups } from "../src/lib/store.ts";

test("YAML data is consistent", async () => {
  const groups = await loadGroups("data");
  assert.ok(groups.length > 0);
  const codes = new Set<string>();
  for (const e of groups.flatMap((g) => g.emoji)) {
    assert.ok(!codes.has(e.code), `duplicate code ${e.code}`);
    codes.add(e.code);
    assert.equal(e.emoji, codeToEmoji(e.code), `emoji/code mismatch ${e.code}`);
    assert.ok(e.name && !/[/;]/.test(e.name), `bad name ${e.code}`);
  }
  const invalid = collect(groups).warnings.filter((w) => w.startsWith("invalid"));
  assert.deepEqual(invalid, []);
});
