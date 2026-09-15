import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDate, formatDuration } from "@/lib/format";
import { TranscriptPane } from "@/components/meeting/TranscriptPane";
import { TemplateSwitcher } from "@/components/meeting/TemplateSwitcher";

export default async function MeetingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ highlight?: string; q?: string }>;
}) {
  const { id } = await params;
  const { highlight, q } = await searchParams;

  const meeting = await prisma.meeting.findUnique({
    where: { id },
    include: {
      participants: true,
      segments: { orderBy: { order: "asc" }, include: { speaker: true } },
      summaries: true,
      actionItems: { orderBy: { order: "asc" } },
      highlights: { orderBy: { atSec: "asc" } },
    },
  });

  if (!meeting) notFound();

  const segments = meeting.segments.map((s) => ({
    id: s.id,
    speakerId: s.speakerId,
    speakerName: s.speaker.name,
    startSec: s.startSec,
    endSec: s.endSec,
    text: s.text,
    order: s.order,
  }));

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <div>
        <Link href="/" className="link text-sm">
          ← All meetings
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
          {meeting.title}
        </h1>
        <p className="text-sm text-foreground-muted">
          {formatDate(meeting.startedAt)} · {formatDuration(meeting.durationSec)} ·{" "}
          {meeting.participants.map((p) => p.name).join(", ")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <TranscriptPane
          meetingId={meeting.id}
          segments={segments}
          highlights={meeting.highlights.map((h) => ({ id: h.id, atSec: h.atSec }))}
          initialSearchQuery={q}
          jumpToSegmentId={highlight}
        />
        <TemplateSwitcher
          summaries={meeting.summaries.map((s) => ({
            template: s.template,
            content: s.content,
          }))}
          actionItems={meeting.actionItems.map((a) => ({
            id: a.id,
            text: a.text,
            owner: a.owner,
          }))}
        />
      </div>
    </div>
  );
}
