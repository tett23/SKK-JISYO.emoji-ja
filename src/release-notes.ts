/**
 * Write the release notes to standard output (ADR 0005).
 *
 *   deno task notes --tag <tag> --repo <owner/repo> --commits <file> --utf8 <dict> --euc <dict> [--prev-tag <tag>]
 *   node dist-js/src/release-notes.js ...
 *
 * The --commits file has one `<SHA>\t<subject>` line per commit (git log --no-merges --format='%H%x09%s').
 */
import { readdir, readFile } from "node:fs/promises";
import process from "node:process";
import { parseArgs } from "node:util";
import { countDict, notes, parseCommits } from "./lib/release-notes.ts";

const { values: opts } = parseArgs({
  args: process.argv.slice(2),
  options: {
    "tag": { type: "string" },
    "repo": { type: "string" },
    "commits": { type: "string" },
    "utf8": { type: "string" },
    "euc": { type: "string" },
    "prev-tag": { type: "string" },
  },
});
const { tag, repo, commits, utf8, euc } = opts;
if (!tag || !repo || !commits || !utf8 || !euc) {
  throw new Error("--tag, --repo, --commits, --utf8 and --euc are required");
}

const adrFiles = (await readdir("docs/adr")).filter((f) => f.endsWith(".md")).sort().map((f) => `docs/adr/${f}`);
const utf8Dict = countDict(await readFile(utf8, "utf-8"));
const eucDict = countDict(new TextDecoder("euc-jp").decode(await readFile(euc)));
process.stdout.write(notes({
  repo,
  tag,
  prevTag: opts["prev-tag"] || undefined,
  adrFiles,
  commits: parseCommits(await readFile(commits, "utf-8")),
  counts: { version: utf8Dict.version, emoji: utf8Dict.emoji, utf8: utf8Dict.headwords, euc: eucDict.headwords },
}));
