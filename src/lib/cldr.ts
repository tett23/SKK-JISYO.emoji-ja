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

/** Unicode License V3, covering CLDR annotations and emoji-test.txt. */
export const UNICODE_NOTICE = `UNICODE LICENSE V3

COPYRIGHT AND PERMISSION NOTICE

Copyright © 1991-2026 Unicode, Inc.

NOTICE TO USER: Carefully read the following legal agreement. BY
DOWNLOADING, INSTALLING, COPYING OR OTHERWISE USING DATA FILES, AND/OR
SOFTWARE, YOU UNEQUIVOCALLY ACCEPT, AND AGREE TO BE BOUND BY, ALL OF THE
TERMS AND CONDITIONS OF THIS AGREEMENT. IF YOU DO NOT AGREE, DO NOT
DOWNLOAD, INSTALL, COPY, DISTRIBUTE OR USE THE DATA FILES OR SOFTWARE.

Permission is hereby granted, free of charge, to any person obtaining a
copy of data files and any associated documentation (the "Data Files") or
software and any associated documentation (the "Software") to deal in the
Data Files or Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, and/or sell
copies of the Data Files or Software, and to permit persons to whom the
Data Files or Software are furnished to do so, provided that either (a)
this copyright and permission notice appear with all copies of the Data
Files or Software, or (b) this copyright and permission notice appear in
associated Documentation.

THE DATA FILES AND SOFTWARE ARE PROVIDED "AS IS", WITHOUT WARRANTY OF ANY
KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT OF
THIRD PARTY RIGHTS.

IN NO EVENT SHALL THE COPYRIGHT HOLDER OR HOLDERS INCLUDED IN THIS NOTICE
BE LIABLE FOR ANY CLAIM, OR ANY SPECIAL INDIRECT OR CONSEQUENTIAL DAMAGES,
OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS,
WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION,
ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THE DATA
FILES OR SOFTWARE.

Except as contained in this notice, the name of a copyright holder shall
not be used in advertising or otherwise to promote the sale, use or other
dealings in these Data Files or Software without prior written
authorization of the copyright holder.`;
