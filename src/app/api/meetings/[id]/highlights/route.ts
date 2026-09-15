import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { CreateHighlightInputSchema, createHighlight } from "@/lib/highlights";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: meetingId } = await params;

  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    select: { id: true },
  });
  if (!meeting) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = CreateHighlightInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const highlight = await createHighlight(meetingId, parsed.data);
  return NextResponse.json(highlight, { status: 201 });
}
