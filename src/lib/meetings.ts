import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { TranscriptSegmentLike } from "@/lib/transcript";

const include = {
  participants: true,
  segments: { orderBy: { order: "asc" as const }, include: { speaker: true } },
  summaries: true,
  actionItems: { orderBy: { order: "asc" as const } },
  highlights: { orderBy: { atSec: "asc" as const } },
} satisfies Prisma.MeetingInclude;

type MeetingWithRelations = Prisma.MeetingGetPayload<{ include: typeof include }>;

export type MeetingDetail = {
  id: string;
  title: string;
  startedAt: Date;
  durationSec: number;
  shareSlug: string;
  participants: { id: string; name: string }[];
  segments: TranscriptSegmentLike[];
  summaries: { template: "ENHANCED" | "BRIEF"; content: string }[];
  actionItems: { id: string; text: string; owner: string | null }[];
  highlights: { id: string; atSec: number }[];
};

function mapMeeting(meeting: MeetingWithRelations): MeetingDetail {
  return {
    id: meeting.id,
    title: meeting.title,
    startedAt: meeting.startedAt,
    durationSec: meeting.durationSec,
    shareSlug: meeting.shareSlug,
    participants: meeting.participants.map((p) => ({ id: p.id, name: p.name })),
    segments: meeting.segments.map((s) => ({
      id: s.id,
      speakerId: s.speakerId,
      speakerName: s.speaker.name,
      startSec: s.startSec,
      endSec: s.endSec,
      text: s.text,
      order: s.order,
    })),
    summaries: meeting.summaries.map((s) => ({ template: s.template, content: s.content })),
    actionItems: meeting.actionItems.map((a) => ({ id: a.id, text: a.text, owner: a.owner })),
    highlights: meeting.highlights.map((h) => ({ id: h.id, atSec: h.atSec })),
  };
}

export async function getMeetingById(id: string): Promise<MeetingDetail | null> {
  const meeting = await prisma.meeting.findUnique({ where: { id }, include });
  return meeting ? mapMeeting(meeting) : null;
}

export async function getMeetingByShareSlug(shareSlug: string): Promise<MeetingDetail | null> {
  const meeting = await prisma.meeting.findUnique({ where: { shareSlug }, include });
  return meeting ? mapMeeting(meeting) : null;
}

export type MeetingSummary = { id: string; title: string };

export async function listMeetingSummaries(): Promise<MeetingSummary[]> {
  return prisma.meeting.findMany({
    select: { id: true, title: true },
    orderBy: { startedAt: "desc" },
  });
}
