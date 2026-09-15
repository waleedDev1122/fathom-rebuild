"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { groupSegmentsBySpeaker, type TranscriptSegmentLike } from "@/lib/transcript";
import { formatClockTime } from "@/lib/format";

type HighlightLike = { id: string; atSec: number };

type TranscriptPaneProps = {
  meetingId: string;
  segments: TranscriptSegmentLike[];
  highlights: HighlightLike[];
};

export function TranscriptPane({ meetingId, segments, highlights }: TranscriptPaneProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const highlightedAtSecs = new Set(highlights.map((h) => h.atSec));
  const groups = groupSegmentsBySpeaker(segments);

  async function handleHighlight(segment: TranscriptSegmentLike) {
    if (pendingId || highlightedAtSecs.has(segment.startSec)) return;
    setPendingId(segment.id);
    try {
      const res = await fetch(`/api/meetings/${meetingId}/highlights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ atSec: segment.startSec }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="card max-h-[70vh] overflow-y-auto">
      <ol className="flex flex-col gap-4">
        {groups.map((group, i) => (
          <li key={`${group.speakerId}-${i}`}>
            <div className="mb-1 flex items-baseline gap-2">
              <span className="text-sm font-semibold text-foreground">
                {group.speakerName}
              </span>
              <span className="text-xs text-foreground-muted">
                {formatClockTime(group.startSec)}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              {group.segments.map((segment) => {
                const isHighlighted = highlightedAtSecs.has(segment.startSec);
                return (
                  <div key={segment.id} className="group flex items-start gap-2">
                    <button
                      type="button"
                      onClick={() => handleHighlight(segment)}
                      disabled={isHighlighted || pendingId === segment.id}
                      aria-label={isHighlighted ? "Highlighted" : "Highlight this moment"}
                      aria-pressed={isHighlighted}
                      className={
                        "mt-0.5 shrink-0 disabled:cursor-default " +
                        (isHighlighted
                          ? "text-brand"
                          : "text-foreground-muted opacity-0 transition-opacity hover:text-brand focus-visible:opacity-100 group-hover:opacity-100")
                      }
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 20 20"
                        fill={isHighlighted ? "currentColor" : "none"}
                        stroke="currentColor"
                        strokeWidth="1.5"
                        aria-hidden
                      >
                        <path
                          d="M10 2l2.39 4.84 5.34.78-3.87 3.77.91 5.32L10 14.9l-4.77 2.51.91-5.32L2.27 7.62l5.34-.78L10 2z"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    <p className="text-sm text-foreground-muted">{segment.text}</p>
                  </div>
                );
              })}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
