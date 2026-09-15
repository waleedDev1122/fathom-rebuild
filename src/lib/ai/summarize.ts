import { openai } from "./client";
import {
  buildPrompt,
  type SummaryTemplateKind,
  type TranscriptSegmentInput,
} from "./prompts";
import { SummaryResultSchema, type SummaryResult } from "./schema";

export class SummarizationError extends Error {}

const MODEL = process.env.OPENAI_SUMMARY_MODEL ?? "gpt-4o-mini";

export function parseSummaryResponse(raw: string): SummaryResult {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (err) {
    throw new SummarizationError(
      `OpenAI response was not valid JSON: ${(err as Error).message}`
    );
  }

  const result = SummaryResultSchema.safeParse(json);
  if (!result.success) {
    throw new SummarizationError(
      `OpenAI response failed schema validation: ${result.error.message}`
    );
  }
  return result.data;
}

export async function summarizeMeeting(params: {
  title: string;
  participants: string[];
  segments: TranscriptSegmentInput[];
  template: SummaryTemplateKind;
}): Promise<SummaryResult> {
  const { system, user } = buildPrompt(params);

  const completion = await openai.chat.completions.create({
    model: MODEL,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new SummarizationError("OpenAI response contained no content");
  }

  return parseSummaryResponse(content);
}
