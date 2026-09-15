export type HighlightPart = { text: string; match: boolean };

/** Splits `text` into match/non-match parts for a case-insensitive `query`. */
export function highlightMatches(text: string, query: string): HighlightPart[] {
  const trimmed = query.trim();
  if (!trimmed) return [{ text, match: false }];

  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escaped, "gi");

  const parts: HighlightPart[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index), match: false });
    }
    parts.push({ text: match[0], match: true });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), match: false });
  }

  return parts.length ? parts : [{ text, match: false }];
}

/** Total number of non-overlapping case-insensitive matches of `query` in `text`. */
export function countMatches(text: string, query: string): number {
  const trimmed = query.trim();
  if (!trimmed) return 0;
  return highlightMatches(text, trimmed).filter((p) => p.match).length;
}

export type MatchRef = { segmentId: string; indexInSegment: number };

/**
 * Flat, document-order list of every match across `segments`, so a caller can
 * step through them (next/previous) independent of which segment they fall in.
 */
export function buildMatchRefs(
  segments: { id: string; text: string }[],
  query: string
): MatchRef[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const refs: MatchRef[] = [];
  for (const segment of segments) {
    const count = countMatches(segment.text, trimmed);
    for (let i = 0; i < count; i++) {
      refs.push({ segmentId: segment.id, indexInSegment: i });
    }
  }
  return refs;
}
