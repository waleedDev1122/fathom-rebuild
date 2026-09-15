import { z } from "zod";
import { prisma } from "@/lib/db";

export const CreateHighlightInputSchema = z.object({
  atSec: z.number().int().nonnegative(),
  note: z.string().min(1).optional(),
});

export type CreateHighlightInput = z.infer<typeof CreateHighlightInputSchema>;

export async function createHighlight(meetingId: string, input: CreateHighlightInput) {
  return prisma.highlight.create({
    data: {
      meetingId,
      atSec: input.atSec,
      note: input.note,
    },
  });
}
