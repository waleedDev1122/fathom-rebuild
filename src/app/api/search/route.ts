import { NextResponse } from "next/server";
import { searchMeetings } from "@/lib/search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const meetingId = searchParams.get("meetingId") ?? undefined;
  const results = await searchMeetings(q, meetingId);
  return NextResponse.json({ results });
}
