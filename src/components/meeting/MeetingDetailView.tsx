import Link from "next/link";
import { formatDate, formatDuration } from "@/lib/format";
import type { MeetingDetail } from "@/lib/meetings";
import { TranscriptPane } from "@/components/meeting/TranscriptPane";
import { TemplateSwitcher } from "@/components/meeting/TemplateSwitcher";
import { ShareLinkButton } from "@/components/meeting/ShareLinkButton";

type MeetingDetailViewProps = {
  meeting: MeetingDetail;
  /** Renders the public, read-only share view: no back-to-library link, no highlight creation. */
  readOnly?: boolean;
  initialSearchQuery?: string;
  jumpToSegmentId?: string;
};

export function MeetingDetailView({
  meeting,
  readOnly = false,
  initialSearchQuery,
  jumpToSegmentId,
}: MeetingDetailViewProps) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        {readOnly ? (
          <span className="w-fit rounded-default bg-surface-muted px-2 py-1 text-xs font-medium text-foreground-muted">
            Shared meeting · read-only
          </span>
        ) : (
          <Link href="/" className="link text-sm">
            ← All meetings
          </Link>
        )}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              {meeting.title}
            </h1>
            <p className="text-sm text-foreground-muted">
              {formatDate(meeting.startedAt)} · {formatDuration(meeting.durationSec)} ·{" "}
              {meeting.participants.map((p) => p.name).join(", ")}
            </p>
          </div>
          {!readOnly && <ShareLinkButton shareSlug={meeting.shareSlug} />}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <TranscriptPane
          meetingId={meeting.id}
          segments={meeting.segments}
          highlights={meeting.highlights}
          initialSearchQuery={initialSearchQuery}
          jumpToSegmentId={jumpToSegmentId}
          readOnly={readOnly}
        />
        <TemplateSwitcher summaries={meeting.summaries} actionItems={meeting.actionItems} />
      </div>
    </div>
  );
}
