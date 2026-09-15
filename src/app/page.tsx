export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="card flex max-w-md flex-col items-start gap-3">
        <span className="rounded-default bg-surface-muted px-2 py-1 text-xs font-medium text-foreground-muted">
          Phase 0
        </span>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Fathom Rebuild
        </h1>
        <p className="text-sm text-foreground-muted">
          Scaffold is live. Meeting list, transcripts, AI summaries, and
          search land in the phases that follow.
        </p>
      </div>
    </div>
  );
}
