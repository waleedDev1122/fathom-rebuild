"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { MeetingSummary } from "@/lib/meetings";

type SearchSnippet = { type: "transcript" | "summary"; text: string; segmentId?: string };
type SearchResult = { meetingId: string; title: string; snippets: SearchSnippet[] };

function meetingHref(meetingId: string, query: string, snippet?: SearchSnippet) {
  const params = new URLSearchParams({ q: query });
  if (snippet?.segmentId) params.set("highlight", snippet.segmentId);
  return `/meetings/${meetingId}?${params.toString()}`;
}

export function AskFathomPanel({ meetings }: { meetings: MeetingSummary[] }) {
  const [open, setOpen] = useState(false);
  const [scopeId, setScopeId] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [resultsQuery, setResultsQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams({ q: trimmed });
      if (scopeId) params.set("meetingId", scopeId);
      fetch(`/api/search?${params.toString()}`, { signal: controller.signal })
        .then((res) => res.json())
        .then((data: { results: SearchResult[] }) => {
          setResults(data.results);
          setResultsQuery(trimmed);
        })
        .catch((err: unknown) => {
          if (err instanceof Error && err.name !== "AbortError") {
            setResults([]);
            setResultsQuery(trimmed);
          }
        })
        .finally(() => setLoading(false));
    }, 300);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query, scopeId]);

  const trimmedQuery = query.trim();
  // Only trust `results` once it was computed for the current query — otherwise a
  // fast retype would flash stale results from the previous query while debouncing.
  const showResults = !loading && results !== null && resultsQuery === trimmedQuery;
  const showSearching = loading || results === null || resultsQuery !== trimmedQuery;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="btn btn-secondary"
        aria-expanded={open}
      >
        Ask Fathom
      </button>

      {open && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/20">
          <aside className="flex h-full w-full max-w-sm flex-col gap-4 overflow-y-auto border-l border-border bg-surface p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Ask Fathom</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close Ask Fathom"
                className="rounded-default px-2 py-1 text-foreground-muted hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                ✕
              </button>
            </div>

            <label className="flex flex-col gap-1 text-xs font-medium text-foreground-muted">
              My Calls
              <select
                value={scopeId}
                onChange={(e) => setScopeId(e.target.value)}
                className="rounded-default border border-border bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <option value="">All meetings</option>
                {meetings.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </label>

            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search meetings…"
              aria-label="Search meetings"
              className="w-full rounded-default border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            />

            {trimmedQuery && (
              <div className="card flex flex-col gap-3">
                {showSearching && <p className="text-sm text-foreground-muted">Searching…</p>}
                {showResults && results.length === 0 && (
                  <p className="text-sm text-foreground-muted">
                    No results for &quot;{trimmedQuery}&quot;.
                  </p>
                )}
                {showResults &&
                  results.map((result) => (
                    <div key={result.meetingId} className="flex flex-col gap-1 rounded-default p-2">
                      <Link
                        href={meetingHref(result.meetingId, trimmedQuery)}
                        onClick={() => setOpen(false)}
                        className="text-sm font-medium text-foreground hover:text-brand"
                      >
                        {result.title}
                      </Link>
                      {result.snippets.slice(0, 2).map((s, i) => (
                        <Link
                          key={i}
                          href={meetingHref(result.meetingId, trimmedQuery, s)}
                          onClick={() => setOpen(false)}
                          className="-mx-1 rounded-sm px-1 text-xs text-foreground-muted transition-colors hover:bg-surface-muted hover:text-foreground"
                        >
                          {s.text}
                        </Link>
                      ))}
                    </div>
                  ))}
              </div>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
