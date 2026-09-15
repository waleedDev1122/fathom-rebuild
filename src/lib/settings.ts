import { z } from "zod";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";

export const SETTINGS_ID = "singleton";

export const UpdateSettingsInputSchema = z.object({
  autoRecordEnabled: z.boolean().optional(),
  autoShareEnabled: z.boolean().optional(),
  botName: z.string().min(1).max(60).optional(),
  defaultTemplate: z.enum(["ENHANCED", "BRIEF"]).optional(),
  defaultShareAccess: z.enum(["ANYONE_WITH_LINK", "MEETING_PARTICIPANTS_ONLY"]).optional(),
});

export type UpdateSettingsInput = z.infer<typeof UpdateSettingsInputSchema>;

export async function getSettings() {
  try {
    return await prisma.settings.upsert({
      where: { id: SETTINGS_ID },
      update: {},
      create: { id: SETTINGS_ID },
    });
  } catch (err) {
    // Two concurrent first-reads can both attempt to create the singleton row;
    // the loser hits a unique-constraint violation, but the row now exists.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const existing = await prisma.settings.findUnique({ where: { id: SETTINGS_ID } });
      if (existing) return existing;
    }
    throw err;
  }
}

export async function updateSettings(input: UpdateSettingsInput) {
  return prisma.settings.upsert({
    where: { id: SETTINGS_ID },
    update: input,
    create: { id: SETTINGS_ID, ...input },
  });
}
