"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type SearchSnippet = { type: "transcript" | "summary"; text: string; segmentId?: string };
type SearchResult = { meetingId: string; title: string; snippets: SearchSnippet[] };

function meetingHref(meetingId: string, query: string, snippet?: SearchSnippet) {
  const params = new URLSearchParams({ q: query });
  if (snippet?.segmentId) params.set("highlight", snippet.segmentId);
  return `/meetings/${meetingId}?${params.toString()}`;
}

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      setLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
        signal: controller.signal,
      })
        .then((res) => res.json())
        .then((data: { results: SearchResult[] }) => setResults(data.results))
        .catch((err: unknown) => {
          if (err instanceof Error && err.name !== "AbortError") setResults([]);
        })
        .finally(() => setLoading(false));
    }, 300);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  const trimmedQuery = query.trim();

  return (
    <div className="flex flex-col gap-2">
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
          {loading && <p className="text-sm text-foreground-muted">Searching…</p>}
          {!loading && results?.length === 0 && (
            <p className="text-sm text-foreground-muted">
              No results for &quot;{trimmedQuery}&quot;.
            </p>
          )}
          {!loading &&
            results?.map((result) => (
              <div key={result.meetingId} className="flex flex-col gap-1 rounded-default p-2">
                <Link
                  href={meetingHref(result.meetingId, trimmedQuery)}
                  className="text-sm font-medium text-foreground hover:text-brand"
                >
                  {result.title}
                </Link>
                {result.snippets.slice(0, 2).map((s, i) => (
                  <Link
                    key={i}
                    href={meetingHref(result.meetingId, trimmedQuery, s)}
                    className="-mx-1 rounded-sm px-1 text-xs text-foreground-muted transition-colors hover:bg-surface-muted hover:text-foreground"
                  >
                    {s.text}
                  </Link>
                ))}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
