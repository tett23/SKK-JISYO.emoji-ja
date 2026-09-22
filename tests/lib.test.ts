import assert from "node:assert/strict";
import { test } from "node:test";
import { lookup, parseAnnotations } from "../src/lib/cldr.ts";
import { parseEmojiTest, skinToneLabel } from "../src/lib/emoji-test.ts";
import { encodeEucJp, isEucJpEncodable } from "../src/lib/eucjp.ts";
import { expandVu, isValidReading, kanaToReading } from "../src/lib/kana.ts";
import { collect, lispCandidate, renderEucJp, renderUtf8 } from "../src/lib/skk.ts";
import type { GroupData } from "../src/lib/store.ts";

const hex = (b: Uint8Array) => [...b].map((x) => x.toString(16).padStart(2, "0")).join("");

test("parseEmojiTest reads version, groups and skin tone variants", () => {
  const t = parseEmojiTest(`# Version: 18.0
# group: People & Body
# subgroup: hand-fingers-open
1F44B                                                  ; fully-qualified     # 👋 E0.6 waving hand
1F44B 1F3FB                                            ; fully-qualified     # 👋🏻 E1.0 waving hand: light skin tone
263A                                                   ; unqualified         # ☺ E0.6 smiling face
# group: Component
1F3FB                                                  ; component           # 🏻 E1.0 light skin tone
`);
  assert.equal(t.version, "18.0");
  assert.deepEqual(t.entries.map((e) => [e.emoji, e.skinVariant, e.group]), [
    ["👋", false, "People & Body"],
    ["👋🏻", true, "People & Body"],
    ["🏻", false, "Component"],
  ]);
  assert.equal(skinToneLabel("1F9D1 1F3FB 200D 1F91D 200D 1F9D1 1F3FF"), "薄い肌色・濃い肌色");
});

test("parseAnnotations merges tts names and keywords, lookup ignores FE0F", () => {
  const a = parseAnnotations(
    `<annotation cp="☺">笑顔 | 顔</annotation><annotation cp="☺" type="tts">ほほえみ</annotation>`,
    `<annotation cp="☺" type="tts">ほほえむ顔</annotation>`,
  );
  assert.deepEqual(lookup(a, "☺\ufe0f"), { name: "ほほえむ顔", keywords: ["笑顔", "顔"] });
});

test("kana helpers", () => {
  assert.equal(kanaToReading("ヴァイオリン"), "ゔぁいおりん");
  assert.equal(kanaToReading("笑顔"), undefined);
  assert.deepEqual(expandVu("ゔぁいおりん"), ["ゔぁいおりん", "ばいおりん"]);
  assert.ok(isValidReading("12じ"));
  assert.ok(isValidReading("ok"));
  assert.ok(!isValidReading("ok!"));
  assert.ok(!isValidReading("カタカナ"));
});

test("EUC-JP encoder", () => {
  assert.equal(hex(encodeEucJp("あ漢ｱ")), "a4a2b4c18eb1");
  assert.equal(hex(encodeEucJp("〜")), hex(encodeEucJp("～")));
  assert.ok(!isEucJpEncodable("😀"));
  assert.ok(!isEucJpEncodable("①")); // NEC row 13 is not standard EUC-JP
  assert.equal(hex(encodeEucJp("😀")), "3f");
});

test("lispCandidate escapes everything but alphanumerics", () => {
  assert.equal(lispCandidate("👋🏻"), '(concat "\\U0001F44B\\U0001F3FB")');
  assert.equal(lispCandidate("#️⃣"), '(concat "\\u0023\\uFE0F\\u20E3")');
  assert.equal(lispCandidate("1️⃣"), '(concat "1\\uFE0F\\u20E3")');
});

const groups: GroupData[] = [{
  group: "g",
  emoji: [
    {
      emoji: "😂",
      code: "1F602",
      name: "うれし泣き",
      readings: ["うれしなき", "くさ"],
      en: "",
      since: "0.6",
      subgroup: "",
    },
    { emoji: "🌿", code: "1F33F", name: "ハーブ", readings: ["くさ"], en: "", since: "1.0", subgroup: "" },
    {
      emoji: "👋",
      code: "1F44B",
      name: "手/振る",
      readings: ["てをふる", "bad!"],
      en: "",
      since: "0.6",
      subgroup: "",
      variants: ["1F44B 1F3FB"],
    },
  ],
}];

test("collect orders candidates by reading rank, then data order, variants last", () => {
  const d = collect(groups);
  assert.deepEqual(d.entries.get("くさ")!.map((c) => c.emoji), ["🌿", "😂"]);
  assert.deepEqual(d.entries.get("てをふる"), [
    { emoji: "👋", annotation: "手／振る" },
    { emoji: "👋🏻", annotation: "手／振る（薄い肌色）" },
  ]);
  assert.equal(d.emojiCount, 4);
  assert.equal(d.warnings.length, 1);
});

test("render UTF-8 and EUC-JP dictionaries", () => {
  const meta = { unicode_emoji_version: "18.0", cldr_ref: "main" };
  const d = collect(groups);
  const utf8 = new TextDecoder().decode(renderUtf8(meta, d, "x"));
  assert.match(utf8, /\n;; okuri-nasi entries\.\nうれしなき \/😂;うれし泣き\/\nくさ \/🌿;ハーブ\/😂;うれし泣き\/\n/);
  const euc = new TextDecoder("euc-jp").decode(renderEucJp(meta, d, "x"));
  assert.match(euc, /\nくさ \/\(concat "\\U0001F33F"\);ハーブ\/\(concat "\\U0001F602"\);うれし泣き\/\n/);
});
