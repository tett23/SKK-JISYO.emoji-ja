// ADR 0005: English release notes grouped by change type
import assert from "node:assert/strict";
import { test } from "node:test";
import { classify, countDict, isVersionBump, linkSubject, notes, parseCommits } from "../src/lib/release-notes.ts";

const repo = "owner/repo";
const ctx = { repo, tag: "v0.2.0", adrFiles: ["docs/adr/0002-bang-prefixed-headwords.md"] };
const counts = { version: "18.0", emoji: 3972, utf8: 17324, euc: 17310 };

test("classify uses the first word of the subject", () => {
  for (const s of ["Add x", "introduce x", "Create x", "Support x"]) assert.equal(classify(s), "Added", s);
  for (const s of ["Remove x", "Delete x", "Drop x"]) assert.equal(classify(s), "Removed", s);
  for (const s of ["Fix x", "Correct x"]) assert.equal(classify(s), "Fixed", s);
  for (const s of ["Rename x", "Include x", "Merge x", "Added x"]) assert.equal(classify(s), "Changed", s);
});

test("isVersionBump matches subjects that are only a version", () => {
  assert.ok(isVersionBump("v0.1.0"));
  assert.ok(isVersionBump("v0.1.0-rc1"));
  assert.ok(!isVersionBump("v0.1.0 release"));
  assert.ok(!isVersionBump("Update to v0.1.0"));
});

test("parseCommits reads <SHA>\\t<subject> lines", () => {
  assert.deepEqual(parseCommits("abc\tAdd x\n\ndef\tFix\ty\n"), [
    { sha: "abc", subject: "Add x" },
    { sha: "def", subject: "Fix\ty" },
  ]);
});

test("linkSubject links PRs and ADRs with absolute URLs", () => {
  assert.equal(
    linkSubject("Add ! headwords (ADR 0002) (#12)", ctx),
    "Add ! headwords ([ADR 0002](https://github.com/owner/repo/blob/v0.2.0/docs/adr/0002-bang-prefixed-headwords.md))" +
      " ([#12](https://github.com/owner/repo/pull/12))",
  );
  assert.equal(linkSubject("See ADR 0099", ctx), "See ADR 0099");
});

const commits = [
  { sha: "1111111aaaa", subject: "Add ! headwords (ADR 0002)" },
  { sha: "2222222bbbb", subject: "v0.2.0" },
  { sha: "3333333cccc", subject: "Rename slack field" },
  { sha: "4444444dddd", subject: "Fix README" },
  { sha: "5555555eeee", subject: "Add docs" },
];

test("notes start with a link to the previous release, or First release.", () => {
  const withPrev = notes({ ...ctx, prevTag: "v0.1.5", commits, counts });
  assert.ok(
    withPrev.startsWith("## v0.2.0\n\nChanges since [v0.1.5](https://github.com/owner/repo/releases/tag/v0.1.5).\n"),
  );
  assert.ok(notes({ ...ctx, commits, counts }).startsWith("## v0.2.0\n\nFirst release.\n"));
});

test("notes list sections in order and skip empty change sections", () => {
  const text = notes({ ...ctx, prevTag: "v0.1.5", commits, counts });
  const headings = text.split("\n").filter((l) => l.startsWith("### "));
  assert.deepEqual(headings, ["### Added", "### Changed", "### Fixed", "### Dictionary", "### Files"]);
  assert.match(
    text,
    /### Dictionary\n\n- Unicode Emoji 18\.0: 3972 emoji\n- Headwords: 17324 \(UTF-8\), 17310 \(EUC-JP\)\n/,
  );
  for (const f of ["SKK-JISYO.emoji-ja", "SKK-JISYO.emoji-ja.utf8", "LICENSE-Unicode.txt", "SHA256SUMS"]) {
    assert.ok(text.includes(`| \`${f}\` |`), f);
  }
});

test("notes skip version-only commits and keep the given order", () => {
  const text = notes({ ...ctx, prevTag: "v0.1.5", commits, counts });
  assert.ok(!text.includes("2222222"));
  const added = text.split("### Added\n\n")[1]!.split("\n\n")[0]!.split("\n");
  assert.deepEqual(added, [
    "- Add ! headwords ([ADR 0002](https://github.com/owner/repo/blob/v0.2.0/docs/adr/0002-bang-prefixed-headwords.md))" +
    " ([1111111](https://github.com/owner/repo/commit/1111111aaaa))",
    "- Add docs ([5555555](https://github.com/owner/repo/commit/5555555eeee))",
  ]);
});

test("countDict reads the header and counts okuri-nasi lines", () => {
  const dict = [
    ";; -*- mode: fundamental; coding: utf-8 -*-",
    ";; Unicode Emoji 18.0 (3972 emoji) with Japanese readings.",
    ";; okuri-ari entries.",
    ";; okuri-nasi entries.",
    "!くさ /🌿;ハーブ/",
    "くさ /🌿;ハーブ/",
    "",
  ].join("\n");
  assert.deepEqual(countDict(dict), { version: "18.0", emoji: 3972, headwords: 2 });
});
