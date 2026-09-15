"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { groupSegmentsBySpeaker, type TranscriptSegmentLike } from "@/lib/transcript";
import { formatClockTime } from "@/lib/format";
import { buildMatchRefs, highlightMatches } from "@/lib/highlight";

type HighlightLike = { id: string; atSec: number };

type TranscriptPaneProps = {
  meetingId: string;
  segments: TranscriptSegmentLike[];
  highlights: HighlightLike[];
  /** Prefills the in-transcript search, e.g. when arriving from global search. */
  initialSearchQuery?: string;
  /** Scrolls to and flashes this segment on mount, e.g. when arriving from global search. */
  jumpToSegmentId?: string;
  /** Hides the highlight-creation control, e.g. on the public read-only share view. */
  readOnly?: boolean;
};

export function TranscriptPane({
  meetingId,
  segments,
  highlights,
  initialSearchQuery,
  jumpToSegmentId,
  readOnly = false,
}: TranscriptPaneProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [query, setQuery] = useState(initialSearchQuery ?? "");
  const [flashedId, setFlashedId] = useState<string | null>(
    jumpToSegmentId ?? null
  );
  const highlightedAtSecs = new Set(highlights.map((h) => h.atSec));
  const groups = groupSegmentsBySpeaker(segments);

  const matchRefs = buildMatchRefs(segments, query);
  const matchCount = matchRefs.length;

  const [activeMatchIndex, setActiveMatchIndex] = useState(() => {
    if (!jumpToSegmentId) return 0;
    const refs = buildMatchRefs(segments, initialSearchQuery ?? "");
    const idx = refs.findIndex((r) => r.segmentId === jumpToSegmentId);
    return idx === -1 ? 0 : idx;
  });

  const isFirstQueryRender = useRef(true);
  useEffect(() => {
    if (isFirstQueryRender.current) {
      isFirstQueryRender.current = false;
      return;
    }
    setActiveMatchIndex(0);
  }, [query]);

  useEffect(() => {
    if (matchCount === 0) return;
    const el = document.getElementById(`match-${activeMatchIndex}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    // `query` isn't read directly, but a query change re-renders the <mark> at this
    // same index to a different spot in the transcript, so it must re-trigger the scroll.
  }, [activeMatchIndex, matchCount, query]);

  useEffect(() => {
    if (!jumpToSegmentId) return;
    const el = document.getElementById(`segment-${jumpToSegmentId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    const timeout = setTimeout(() => setFlashedId(null), 2500);
    return () => clearTimeout(timeout);
  }, [jumpToSegmentId]);

  function goToMatch(index: number) {
    if (matchCount === 0) return;
    setActiveMatchIndex(((index % matchCount) + matchCount) % matchCount);
  }

  function goToNextMatch() {
    goToMatch(activeMatchIndex + 1);
  }

  function goToPreviousMatch() {
    goToMatch(activeMatchIndex - 1);
  }

  function handleSearchKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (e.shiftKey) {
      goToPreviousMatch();
    } else {
      goToNextMatch();
    }
  }

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
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="Search this transcript…"
          aria-label="Search this transcript"
          className="w-full rounded-default border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        />
        {query.trim() && (
          <div className="flex shrink-0 items-center gap-1">
            <span className="text-xs text-foreground-muted">
              {matchCount === 0
                ? "No matches"
                : `${activeMatchIndex + 1} of ${matchCount}`}
            </span>
            <button
              type="button"
              onClick={goToPreviousMatch}
              disabled={matchCount === 0}
              aria-label="Previous match"
              className="rounded-default p-1 text-foreground-muted hover:text-brand disabled:pointer-events-none disabled:opacity-40"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden
              >
                <path
                  d="M12.5 5l-5 5 5 5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={goToNextMatch}
              disabled={matchCount === 0}
              aria-label="Next match"
              className="rounded-default p-1 text-foreground-muted hover:text-brand disabled:pointer-events-none disabled:opacity-40"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden
              >
                <path
                  d="M7.5 5l5 5-5 5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        )}
      </div>

      <div className="card max-h-[70vh] overflow-y-auto">
        <ol className="flex flex-col gap-4">
          {(() => {
            let matchCursor = 0;
            return groups.map((group, i) => (
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
                    const isHighlighted = highlightedAtSecs.has(
                      segment.startSec
                    );
                    const isFlashed = flashedId === segment.id;
                    return (
                      <div
                        key={segment.id}
                        id={`segment-${segment.id}`}
                        className={
                          "group flex items-start gap-2 rounded-default transition-colors duration-1000" +
                          (isFlashed ? " highlight-flash" : "")
                        }
                      >
                        {readOnly ? (
                          isHighlighted && (
                            <span
                              aria-label="Highlighted"
                              className="mt-0.5 shrink-0 text-brand"
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                aria-hidden
                              >
                                <path
                                  d="M10 2l2.39 4.84 5.34.78-3.87 3.77.91 5.32L10 14.9l-4.77 2.51.91-5.32L2.27 7.62l5.34-.78L10 2z"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </span>
                          )
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleHighlight(segment)}
                            disabled={isHighlighted || pendingId === segment.id}
                            aria-label={
                              isHighlighted
                                ? "Highlighted"
                                : "Highlight this moment"
                            }
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
                        )}
                        <p className="text-sm text-foreground-muted">
                          {highlightMatches(segment.text, query).map(
                            (part, j) => {
                              if (!part.match)
                                return <span key={j}>{part.text}</span>;
                              const idx = matchCursor++;
                              const isActive = idx === activeMatchIndex;
                              return (
                                <mark
                                  key={j}
                                  id={`match-${idx}`}
                                  className={
                                    "rounded-sm " +
                                    (isActive
                                      ? "bg-brand text-brand-foreground"
                                      : "bg-brand/30 text-foreground")
                                  }
                                >
                                  {part.text}
                                </mark>
                              );
                            }
                          )}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </li>
            ));
          })()}
        </ol>
      </div>
    </div>
  );
}
