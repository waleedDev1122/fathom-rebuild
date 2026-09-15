import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDate, formatDuration } from "@/lib/format";
import { getSettings } from "@/lib/settings";

// Settings are user-editable at runtime (see /settings); this page must
// reflect the current row on every request, not a build-time snapshot.
export const dynamic = "force-dynamic";

export default async function Home() {
  const [meetings, settings] = await Promise.all([
    prisma.meeting.findMany({
      orderBy: { startedAt: "desc" },
      include: { participants: true },
    }),
    getSettings(),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Meetings
        </h1>
        <p className="text-sm text-foreground-muted">
          {meetings.length} recorded meeting{meetings.length === 1 ? "" : "s"}
        </p>
        <p className="text-sm text-foreground-muted">
          Auto-record: {settings.autoRecordEnabled ? "All meetings" : "Off"} · Auto-share:{" "}
          {settings.autoShareEnabled ? "Summary + recording" : "Off"} ·{" "}
          <Link href="/settings" className="link">
            Settings
          </Link>
        </p>
      </div>

      {meetings.length === 0 ? (
        <div className="empty-state">
          <p className="text-sm font-medium text-foreground">No meetings yet</p>
          <p className="text-sm text-foreground-muted">
            Recorded meetings will show up here once they&apos;re added.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {meetings.map((meeting) => (
            <li key={meeting.id}>
              <Link
                href={`/meetings/${meeting.id}`}
                className="card flex flex-col gap-2 transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                <div className="flex items-start justify-between gap-4">
                  <h2 className="font-medium text-foreground">{meeting.title}</h2>
                  <span className="shrink-0 rounded-default bg-surface-muted px-2 py-1 text-xs font-medium text-foreground-muted">
                    {formatDuration(meeting.durationSec)}
                  </span>
                </div>
                <p className="text-sm text-foreground-muted">
                  {formatDate(meeting.startedAt)} ·{" "}
                  {meeting.participants.map((p) => p.name).join(", ")}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
