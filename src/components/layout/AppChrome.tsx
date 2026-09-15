"use client";

import { usePathname } from "next/navigation";
import type { MeetingSummary } from "@/lib/meetings";
import { SiteHeader } from "@/components/layout/SiteHeader";

/**
 * Share pages are a zero-chrome, read-only surface for a signed-out visitor
 * (Phase 6) — no global nav/search there, so their contract stays unchanged.
 */
export function AppChrome({
  meetings,
  children,
}: {
  meetings: MeetingSummary[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isSharePage = pathname?.startsWith("/share/");

  if (isSharePage) return <>{children}</>;

  return (
    <>
      <SiteHeader meetings={meetings} />
      {children}
    </>
  );
}
