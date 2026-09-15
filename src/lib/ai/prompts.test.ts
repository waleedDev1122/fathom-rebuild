import { describe, expect, it } from "vitest";
import { buildPrompt } from "./prompts";

const segments = [
  { speaker: "Jordan Lee", startSec: 0, text: "Hey, thanks for hopping on." },
  { speaker: "Sam Osei", startSec: 65, text: "Good week, rewrote the export job." },
];

describe("buildPrompt", () => {
  it("includes meeting title, participants, and timestamped transcript lines", () => {
    const { user } = buildPrompt({
      title: "Weekly 1:1",
      participants: ["Jordan Lee", "Sam Osei"],
      segments,
      template: "BRIEF",
    });

    expect(user).toContain("Meeting: Weekly 1:1");
    expect(user).toContain("Participants: Jordan Lee, Sam Osei");
    expect(user).toContain("[0:00] Jordan Lee: Hey, thanks for hopping on.");
    expect(user).toContain("[1:05] Sam Osei: Good week, rewrote the export job.");
  });

  it("uses the sectioned ENHANCED system prompt with Overview/Key Points/Decisions", () => {
    const { system } = buildPrompt({
      title: "Weekly 1:1",
      participants: ["Jordan Lee"],
      segments,
      template: "ENHANCED",
    });

    expect(system).toContain("## Overview");
    expect(system).toContain("## Key Points");
    expect(system).toContain("## Decisions");
  });

  it("uses a short tl;dr system prompt for BRIEF, without section headings", () => {
    const { system } = buildPrompt({
      title: "Weekly 1:1",
      participants: ["Jordan Lee"],
      segments,
      template: "BRIEF",
    });

    expect(system).toContain("tl;dr");
    expect(system).not.toContain("## Overview");
  });

  it("instructs the model to respond with the {summary, actionItems} JSON shape", () => {
    const { system } = buildPrompt({
      title: "Weekly 1:1",
      participants: ["Jordan Lee"],
      segments,
      template: "ENHANCED",
    });

    expect(system).toContain('"summary"');
    expect(system).toContain('"actionItems"');
  });
});
