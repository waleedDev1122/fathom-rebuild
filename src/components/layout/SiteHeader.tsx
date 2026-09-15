import Link from "next/link";
import type { MeetingSummary } from "@/lib/meetings";
import { AskFathomPanel } from "@/components/search/AskFathomPanel";

export function SiteHeader({ meetings }: { meetings: MeetingSummary[] }) {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 p-4">
        <Link href="/" className="text-sm font-semibold tracking-tight text-foreground">
          Fathom Rebuild
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/settings" className="link text-sm">
            Settings
          </Link>
          <AskFathomPanel meetings={meetings} />
        </nav>
      </div>
    </header>
  );
}
