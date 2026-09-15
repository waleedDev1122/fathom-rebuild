import { notFound } from "next/navigation";
import { getMeetingById } from "@/lib/meetings";
import { MeetingDetailView } from "@/components/meeting/MeetingDetailView";

export default async function MeetingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ highlight?: string; q?: string }>;
}) {
  const { id } = await params;
  const { highlight, q } = await searchParams;

  const meeting = await getMeetingById(id);
  if (!meeting) notFound();

  return <MeetingDetailView meeting={meeting} initialSearchQuery={q} jumpToSegmentId={highlight} />;
}
