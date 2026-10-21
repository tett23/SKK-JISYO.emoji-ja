/** English release notes grouped by change type (ADR 0005). */

export interface Commit {
  sha: string;
  subject: string;
}

export type Section = "Added" | "Changed" | "Removed" | "Fixed";

export interface LinkContext {
  repo: string; // owner/repo
  tag: string;
  adrFiles: string[]; // docs/adr/NNNN-name.md
}

export interface Counts {
  version: string;
  emoji: number;
  utf8: number;
  euc: number;
}

const SECTIONS: Section[] = ["Added", "Changed", "Removed", "Fixed"];

const FIRST_WORD: Record<string, Section> = {
  add: "Added",
  introduce: "Added",
  create: "Added",
  support: "Added",
  remove: "Removed",
  delete: "Removed",
  drop: "Removed",
  fix: "Fixed",
  correct: "Fixed",
};

const FILES: [string, string][] = [
  ["SKK-JISYO.emoji-ja", 'EUC-JP. Emoji are Emacs Lisp `(concat "\\UXXXXXXXX")` forms (DDSKK only)'],
  ["SKK-JISYO.emoji-ja.utf8", "UTF-8 (AquaSKK, macSKK, libskk, ...). Use the EUC-JP version with DDSKK"],
  ["LICENSE", "License of this dictionary (MIT License)"],
  ["LICENSE-Unicode.txt", "License of the emoji list and the CLDR names (Unicode License V3)"],
  ["LICENSE-Mozc.txt", "License of the readings taken from Mozc (BSD 3-Clause License)"],
  ["LICENSE-emoji-data.txt", "License of the shortcodes taken from iamcal/emoji-data (MIT License)"],
  ["SHA256SUMS", "SHA-256 checksums"],
];

/** Section of a commit, chosen by the first word of its subject. */
export function classify(subject: string): Section {
  return FIRST_WORD[subject.trim().split(/\s+/)[0]?.toLowerCase() ?? ""] ?? "Changed";
}

/** True when the subject is only a version (v0.1.0, v0.1.0-rc1). */
export function isVersionBump(subject: string): boolean {
  return /^v\d+(\.\d+)*(-[0-9A-Za-z.]+)?$/.test(subject.trim());
}

/** Parse `git log --format='%H%x09%s'` output. */
export function parseCommits(text: string): Commit[] {
  return text.split("\n").filter((line) => line.trim() !== "").map((line) => {
    const tab = line.indexOf("\t");
    return { sha: line.slice(0, tab), subject: line.slice(tab + 1) };
  });
}

/** Turn `(#123)` and `ADR NNNN` in a subject into absolute links. */
export function linkSubject(subject: string, { repo, tag, adrFiles }: LinkContext): string {
  return subject
    .replace(/\(#(\d+)\)/g, (_, n: string) => `([#${n}](https://github.com/${repo}/pull/${n}))`)
    .replace(/ADR (\d{4})/g, (adr, n: string) => {
      const file = adrFiles.find((f) => f.split("/").at(-1)!.startsWith(`${n}-`));
      return file ? `[${adr}](https://github.com/${repo}/blob/${tag}/${file})` : adr;
    });
}

function commitLine(c: Commit, ctx: LinkContext): string {
  return `- ${linkSubject(c.subject, ctx)} ([${c.sha.slice(0, 7)}](https://github.com/${ctx.repo}/commit/${c.sha}))`;
}

/** Emoji version and count from the header, and the number of okuri-nasi lines. */
export function countDict(text: string): { version: string; emoji: number; headwords: number } {
  const m = /^;; Unicode Emoji (\S+) \((\d+) emoji\)/m.exec(text);
  const headwords = text.split("\n").filter((line) => line !== "" && !line.startsWith(";")).length;
  return { version: m?.[1] ?? "", emoji: Number(m?.[2] ?? 0), headwords };
}

export function notes(args: LinkContext & { prevTag?: string; commits: Commit[]; counts: Counts }): string {
  const { repo, tag, prevTag, counts } = args;
  const commits = args.commits.filter((c) => !isVersionBump(c.subject));
  return [
    `## ${tag}`,
    "",
    prevTag ? `Changes since [${prevTag}](https://github.com/${repo}/releases/tag/${prevTag}).` : "First release.",
    "",
    ...SECTIONS.flatMap((section) => {
      const lines = commits.filter((c) => classify(c.subject) === section).map((c) => commitLine(c, args));
      return lines.length > 0 ? [`### ${section}`, "", ...lines, ""] : [];
    }),
    "### Dictionary",
    "",
    `- Unicode Emoji ${counts.version}: ${counts.emoji} emoji`,
    `- Headwords: ${counts.utf8} (UTF-8), ${counts.euc} (EUC-JP)`,
    "",
    "### Files",
    "",
    "| File | Description |",
    "|---|---|",
    ...FILES.map(([file, description]) => `| \`${file}\` | ${description} |`),
    "",
  ].join("\n");
}
