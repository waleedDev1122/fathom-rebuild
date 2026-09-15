import { z } from "zod";

export const ActionItemSchema = z.object({
  text: z.string().min(1),
  owner: z.string().min(1).optional(),
});

export const SummaryResultSchema = z.object({
  summary: z.string().min(1),
  actionItems: z.array(ActionItemSchema),
});

export type ActionItemResult = z.infer<typeof ActionItemSchema>;
export type SummaryResult = z.infer<typeof SummaryResultSchema>;
