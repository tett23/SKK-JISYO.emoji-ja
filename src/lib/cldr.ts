/** Parser for CLDR `annotations/*.xml` and `annotationsDerived/*.xml`. */

export interface Annotation {
  name?: string;
  keywords: string[];
}

const ANNOTATION = /<annotation cp="([^"]+)"( type="tts")?>([^<]*)<\/annotation>/g;

function unescapeXml(s: string): string {
  return s.replace(
    /&(lt|gt|amp|quot|apos);/g,
    (_, e: string) => ({ lt: "<", gt: ">", amp: "&", quot: '"', apos: "'" })[e]!,
  );
}

/** Parse annotation files; later files take precedence over earlier ones. */
export function parseAnnotations(...xmls: string[]): Map<string, Annotation> {
  const result = new Map<string, Annotation>();
  for (const xml of xmls) {
    for (const [, cp, tts, body] of xml.matchAll(ANNOTATION)) {
      const key = unescapeXml(cp!);
      const value = unescapeXml(body!).trim();
      const a = result.get(key) ?? { keywords: [] };
      if (tts) a.name = value;
      else a.keywords = value.split("|").map((k) => k.trim()).filter(Boolean);
      result.set(key, a);
    }
  }
  return result;
}

export function lookup(annotations: Map<string, Annotation>, emoji: string): Annotation | undefined {
  return annotations.get(emoji) ?? annotations.get(emoji.replaceAll("️", ""));
}
