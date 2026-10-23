export type ExplanationToken = { text: string; bold: boolean };

// Only paired ** markers are interpreted. Everything else remains text;
// especially HTML, links, and unmatched markers never become DOM markup.
export function explanationTokens(value: string): ExplanationToken[] {
  const text = value.replace(/<br\s*\/?\s*>/gi, '\n');
  const tokens: ExplanationToken[] = [];
  let cursor = 0;
  const pattern = /(?<!\*)\*\*([^*]+)\*\*(?!\*)/g;
  for (const match of text.matchAll(pattern)) {
    const at = match.index!;
    if (at > cursor) tokens.push({ text: text.slice(cursor, at), bold: false });
    tokens.push({ text: match[1], bold: true });
    cursor = at + match[0].length;
  }
  if (cursor < text.length) tokens.push({ text: text.slice(cursor), bold: false });
  return tokens;
}
