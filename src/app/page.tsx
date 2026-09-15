import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDate, formatDuration } from "@/lib/format";

export default async function Home() {
  const meetings = await prisma.meeting.findMany({
    orderBy: { startedAt: "desc" },
    include: { participants: true },
  });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Meetings
        </h1>
        <p className="text-sm text-foreground-muted">
          {meetings.length} recorded meeting{meetings.length === 1 ? "" : "s"}
        </p>
      </div>

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
    </div>
  );
}
