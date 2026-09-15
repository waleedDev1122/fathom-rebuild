import { NextResponse } from "next/server";
import { getSettings, updateSettings, UpdateSettingsInputSchema } from "@/lib/settings";

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = UpdateSettingsInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const settings = await updateSettings(parsed.data);
  return NextResponse.json(settings);
}
