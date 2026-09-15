import { notFound } from "next/navigation";
import { getMeetingByShareSlug } from "@/lib/meetings";
import { MeetingDetailView } from "@/components/meeting/MeetingDetailView";

export default async function SharedMeetingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const meeting = await getMeetingByShareSlug(slug);
  if (!meeting) notFound();

  return <MeetingDetailView meeting={meeting} readOnly />;
}
