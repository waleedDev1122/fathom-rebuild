import { beforeEach, describe, expect, it, vi } from "vitest";

const createMock = vi.fn();

vi.mock("./client", () => ({
  openai: {
    chat: {
      completions: {
        create: (...args: unknown[]) => createMock(...args),
      },
    },
  },
}));

const { summarizeMeeting, parseSummaryResponse, SummarizationError } =
  await import("./summarize");

const baseParams = {
  title: "Weekly 1:1",
  participants: ["Jordan Lee", "Sam Osei"],
  segments: [{ speaker: "Jordan Lee", startSec: 0, text: "Hey there." }],
  template: "BRIEF" as const,
};

function mockCompletion(content: string) {
  createMock.mockResolvedValueOnce({
    choices: [{ message: { content } }],
  });
}

describe("parseSummaryResponse", () => {
  it("parses and validates a well-formed response", () => {
    const result = parseSummaryResponse(
      JSON.stringify({
        summary: "Discussed the sprint.",
        actionItems: [{ text: "Follow up on PR", owner: "Sam" }],
      })
    );
    expect(result.summary).toBe("Discussed the sprint.");
    expect(result.actionItems).toEqual([
      { text: "Follow up on PR", owner: "Sam" },
    ]);
  });

  it("allows actionItems without an owner", () => {
    const result = parseSummaryResponse(
      JSON.stringify({ summary: "Short recap.", actionItems: [{ text: "Do the thing" }] })
    );
    expect(result.actionItems[0].owner).toBeUndefined();
  });

  it("throws SummarizationError on malformed JSON", () => {
    expect(() => parseSummaryResponse("not json at all {")).toThrow(
      SummarizationError
    );
  });

  it("throws SummarizationError when required fields are missing", () => {
    expect(() => parseSummaryResponse(JSON.stringify({ summary: "Only a summary" }))).toThrow(
      SummarizationError
    );
  });

  it("throws SummarizationError when actionItems is the wrong shape", () => {
    expect(() =>
      parseSummaryResponse(JSON.stringify({ summary: "Recap", actionItems: "none" }))
    ).toThrow(SummarizationError);
  });
});

describe("summarizeMeeting", () => {
  beforeEach(() => {
    createMock.mockReset();
  });

  it("calls the OpenAI client with JSON mode and the built prompt, returning parsed output", async () => {
    mockCompletion(
      JSON.stringify({
        summary: "Discussed the sprint.",
        actionItems: [{ text: "Follow up on PR", owner: "Sam" }],
      })
    );

    const result = await summarizeMeeting(baseParams);

    expect(result.summary).toBe("Discussed the sprint.");
    expect(createMock).toHaveBeenCalledTimes(1);
    const call = createMock.mock.calls[0][0];
    expect(call.response_format).toEqual({ type: "json_object" });
    expect(call.messages[0].role).toBe("system");
    expect(call.messages[1].role).toBe("user");
    expect(call.messages[1].content).toContain("Weekly 1:1");
  });

  it("throws SummarizationError when the API returns malformed JSON", async () => {
    mockCompletion("{not valid json");
    await expect(summarizeMeeting(baseParams)).rejects.toThrow(SummarizationError);
  });

  it("throws SummarizationError when the API returns no content", async () => {
    createMock.mockResolvedValueOnce({ choices: [{ message: {} }] });
    await expect(summarizeMeeting(baseParams)).rejects.toThrow(SummarizationError);
  });
});
