import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="empty-state max-w-md">
        <p className="text-sm font-medium text-foreground">Not found</p>
        <p className="text-sm text-foreground-muted">
          This page doesn&apos;t exist, or the link is no longer valid.
        </p>
        <Link href="/" className="link mt-2">
          Back to meetings
        </Link>
      </div>
    </div>
  );
}
