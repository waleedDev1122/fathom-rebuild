"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="empty-state max-w-md">
        <p className="text-sm font-medium text-foreground">Something went wrong</p>
        <p className="text-sm text-foreground-muted">
          An unexpected error occurred while loading this page.
        </p>
        <button type="button" onClick={reset} className="btn btn-secondary mt-2">
          Try again
        </button>
      </div>
    </div>
  );
}
