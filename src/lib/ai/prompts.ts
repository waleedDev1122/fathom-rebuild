export type SummaryTemplateKind = "ENHANCED" | "BRIEF";

export type TranscriptSegmentInput = {
  speaker: string;
  startSec: number;
  text: string;
};

function formatTimestamp(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatTranscript(segments: TranscriptSegmentInput[]): string {
  return segments
    .map((s) => `[${formatTimestamp(s.startSec)}] ${s.speaker}: ${s.text}`)
    .join("\n");
}

const JSON_SHAPE_INSTRUCTIONS = `Respond with ONLY valid JSON, no markdown code fences, matching exactly this shape:
{"summary": string, "actionItems": [{"text": string, "owner"?: string}]}
"owner" should be the participant's name only if the action item is clearly assigned to someone; omit the field otherwise.`;

const ENHANCED_SYSTEM_PROMPT = `You are an expert meeting-notes assistant. Given a meeting transcript, produce a sectioned summary as markdown with these exact headings, in this order: "## Overview", "## Key Points", "## Decisions". Be concise but specific — reference what was actually discussed, not generic filler. Then separately list concrete action items.

${JSON_SHAPE_INSTRUCTIONS}`;

const BRIEF_SYSTEM_PROMPT = `You are an expert meeting-notes assistant. Given a meeting transcript, produce a short 2-4 sentence tl;dr summary as plain text, no headings. Then separately list concrete action items.

${JSON_SHAPE_INSTRUCTIONS}`;

export function buildPrompt(params: {
  title: string;
  participants: string[];
  segments: TranscriptSegmentInput[];
  template: SummaryTemplateKind;
}): { system: string; user: string } {
  const { title, participants, segments, template } = params;
  const system =
    template === "ENHANCED" ? ENHANCED_SYSTEM_PROMPT : BRIEF_SYSTEM_PROMPT;
  const user = `Meeting: ${title}\nParticipants: ${participants.join(", ")}\n\nTranscript:\n${formatTranscript(segments)}`;
  return { system, user };
}
