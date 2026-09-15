"use client";

import { useState } from "react";

export function ShareLinkButton({ shareSlug }: { shareSlug: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = `${window.location.origin}/share/${shareSlug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — no-op.
    }
  }

  return (
    <button type="button" onClick={handleCopy} className="btn btn-secondary shrink-0 text-xs">
      {copied ? "Copied!" : "Copy share link"}
    </button>
  );
}
