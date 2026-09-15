import { prisma } from "@/lib/db";

export type SearchSnippet = {
  type: "transcript" | "summary";
  text: string;
  segmentId?: string;
};

export type SearchResult = {
  meetingId: string;
  title: string;
  snippets: SearchSnippet[];
};

const MAX_SNIPPETS_PER_MEETING = 3;
const EXCERPT_RADIUS = 60;

export function excerpt(text: string, query: string, radius = EXCERPT_RADIUS): string {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text.length > radius * 2 ? `${text.slice(0, radius * 2)}…` : text;

  const start = Math.max(0, idx - radius);
  const end = Math.min(text.length, idx + query.length + radius);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < text.length ? "…" : "";
  return `${prefix}${text.slice(start, end).trim()}${suffix}`;
}

export async function searchMeetings(rawQuery: string): Promise<SearchResult[]> {
  const query = rawQuery.trim();
  if (!query) return [];

  const [segments, summaries] = await Promise.all([
    prisma.transcriptSegment.findMany({
      where: { text: { contains: query, mode: "insensitive" } },
      include: { meeting: true },
      take: 50,
    }),
    prisma.summary.findMany({
      where: { content: { contains: query, mode: "insensitive" } },
      include: { meeting: true },
      take: 50,
    }),
  ]);

  const byMeeting = new Map<string, SearchResult>();

  const addSnippet = (
    meetingId: string,
    title: string,
    snippet: SearchSnippet
  ) => {
    const existing = byMeeting.get(meetingId) ?? { meetingId, title, snippets: [] };
    if (existing.snippets.length < MAX_SNIPPETS_PER_MEETING) {
      existing.snippets.push(snippet);
    }
    byMeeting.set(meetingId, existing);
  };

  for (const segment of segments) {
    addSnippet(segment.meetingId, segment.meeting.title, {
      type: "transcript",
      text: excerpt(segment.text, query),
      segmentId: segment.id,
    });
  }

  for (const summary of summaries) {
    addSnippet(summary.meetingId, summary.meeting.title, {
      type: "summary",
      text: excerpt(summary.content, query),
    });
  }

  return Array.from(byMeeting.values());
}
