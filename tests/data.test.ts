import assert from "node:assert/strict";
import { test } from "node:test";
import { codeToEmoji } from "../src/lib/emoji-test.ts";
import { collect, eucLineLength, limitLineLength, MAX_LINE_LENGTH, withBangHeadwords } from "../src/lib/skk.ts";
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
    // ADR 0002: "!" is added only when the dictionaries are written
    for (const v of [...e.readings, ...(e.ime_readings ?? []), ...(e.shortcodes ?? [])]) {
      assert.ok(!v.includes("!"), `"!" in YAML data: ${e.code} ${v}`);
    }
  }
  const invalid = collect(groups).warnings.filter((w) => w.startsWith("invalid"));
  assert.deepEqual(invalid, []);
});

test("every dictionary line fits MAX_LINE_LENGTH and keeps every emoji (ADR 0003)", async () => {
  const collected = collect(await loadGroups("data"));
  const dict = withBangHeadwords(limitLineLength(collected, MAX_LINE_LENGTH));
  assert.equal(MAX_LINE_LENGTH, 4000);
  const tooLong = [...dict.entries].filter(([r, cs]) => eucLineLength(r, cs) > MAX_LINE_LENGTH).map(([r]) => r);
  assert.deepEqual(tooLong, []);
  const kept = new Set([...dict.entries.values()].flat().map((c) => c.emoji));
  const lost = [...new Set([...collected.entries.values()].flat().map((c) => c.emoji))].filter((e) => !kept.has(e));
  assert.deepEqual(lost, []);
});
