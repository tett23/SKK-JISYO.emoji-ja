/**
 * EUC-JP encoder built from the platform TextDecoder (WHATWG euc-jp),
 * restricted to JIS X 0208 standard rows and JIS X 0212.
 */

let table: Map<string, Uint8Array> | undefined;

// Code points that other EUC-JP implementations use for the same byte sequence.
const ALIASES: Record<string, string> = {
  "〜": "～", // 〜 WAVE DASH
  "‖": "∥", // ‖
  "−": "－", // − MINUS SIGN
  "¢": "￠", // ¢
  "£": "￡", // £
  "¬": "￢", // ¬
  "—": "―", // — EM DASH
};

function isStandardJis0208Lead(b: number): boolean {
  // rows 1-8 and 16-84; excludes NEC row 13 and IBM/user-defined rows 85-94
  return (b >= 0xa1 && b <= 0xa8) || (b >= 0xb0 && b <= 0xf4);
}

function buildTable(): Map<string, Uint8Array> {
  const decoder = new TextDecoder("euc-jp", { fatal: true });
  const t = new Map<string, Uint8Array>();
  const add = (bytes: number[]) => {
    let s: string;
    try {
      s = decoder.decode(new Uint8Array(bytes));
    } catch {
      return;
    }
    if (s.length === 1 && s !== "�" && !t.has(s)) t.set(s, new Uint8Array(bytes));
  };
  for (let a = 0xa1; a <= 0xfe; a++) {
    if (!isStandardJis0208Lead(a)) continue;
    for (let b = 0xa1; b <= 0xfe; b++) add([a, b]);
  }
  for (let b = 0xa1; b <= 0xdf; b++) add([0x8e, b]);
  for (let a = 0xa1; a <= 0xfe; a++) for (let b = 0xa1; b <= 0xfe; b++) add([0x8f, a, b]);
  for (const [alias, canonical] of Object.entries(ALIASES)) {
    const bytes = t.get(canonical);
    if (bytes && !t.has(alias)) t.set(alias, bytes);
  }
  return t;
}

function charBytes(c: string): Uint8Array | undefined {
  const cp = c.codePointAt(0)!;
  if (cp < 0x80) return new Uint8Array([cp]);
  table ??= buildTable();
  return table.get(c);
}

export function isEucJpEncodable(s: string): boolean {
  for (const c of s) if (!charBytes(c)) return false;
  return true;
}

/** Encode to EUC-JP. Unencodable characters are replaced by `replacement`. */
export function encodeEucJp(s: string, replacement = "?"): Uint8Array {
  const chunks: Uint8Array[] = [];
  let length = 0;
  for (const c of s) {
    const bytes = charBytes(c) ?? new TextEncoder().encode(replacement);
    chunks.push(bytes);
    length += bytes.length;
  }
  const out = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

export function compareBytes(a: Uint8Array, b: Uint8Array): number {
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) return a[i]! - b[i]!;
  return a.length - b.length;
}
