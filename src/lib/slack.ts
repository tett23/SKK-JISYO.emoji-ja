/** Slack-style short names (e.g. "thumbsup") from iamcal/emoji-data `emoji.json`. */

interface EmojiDataEntry {
  unified: string; // "1F44D" / "2764-FE0F"
  non_qualified?: string | null;
  short_names: string[];
}

/** Valid Slack short name headword (used without the surrounding colons). */
export const VALID_SLACK_NAME = /^[a-z0-9_+-]+$/;

const normalize = (code: string) => code.toUpperCase().replaceAll("-", " ").replace(/ FE0F/g, "");

/** code points (FE0F removed) -> short names */
export function parseEmojiData(json: string): Map<string, string[]> {
  const result = new Map<string, string[]>();
  for (const e of JSON.parse(json) as EmojiDataEntry[]) {
    result.set(normalize(e.unified), e.short_names);
    if (e.non_qualified) result.set(normalize(e.non_qualified), e.short_names);
  }
  return result;
}

export function lookupSlack(names: Map<string, string[]>, code: string): string[] {
  return names.get(normalize(code)) ?? [];
}
