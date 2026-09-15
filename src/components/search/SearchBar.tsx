"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type SearchSnippet = { type: "transcript" | "summary"; text: string };
type SearchResult = { meetingId: string; title: string; snippets: SearchSnippet[] };

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
              <Link
                key={result.meetingId}
                href={`/meetings/${result.meetingId}`}
                className="flex flex-col gap-1 rounded-default p-2 transition-colors hover:bg-surface-muted"
              >
                <span className="text-sm font-medium text-foreground">{result.title}</span>
                {result.snippets.slice(0, 2).map((s, i) => (
                  <span key={i} className="text-xs text-foreground-muted">
                    {s.text}
                  </span>
                ))}
              </Link>
            ))}
        </div>
      )}
    </div>
  );
}
