import { describe, expect, it } from "vitest";
import { buildMatchRefs, countMatches, highlightMatches } from "./highlight";

describe("highlightMatches", () => {
  it("returns the whole text as a single non-match part for a blank query", () => {
    expect(highlightMatches("hello world", "")).toEqual([
      { text: "hello world", match: false },
    ]);
    expect(highlightMatches("hello world", "   ")).toEqual([
      { text: "hello world", match: false },
    ]);
  });

  it("splits out a single match, case-insensitively", () => {
    expect(
      highlightMatches("the Billing Migration is done", "billing migration")
    ).toEqual([
      { text: "the ", match: false },
      { text: "Billing Migration", match: true },
      { text: " is done", match: false },
    ]);
  });

  it("splits out every occurrence of a repeated match", () => {
    expect(highlightMatches("bug bug bug", "bug")).toEqual([
      { text: "bug", match: true },
      { text: " ", match: false },
      { text: "bug", match: true },
      { text: " ", match: false },
      { text: "bug", match: true },
    ]);
  });

  it("returns a single non-match part when there is no match", () => {
    expect(highlightMatches("hello world", "xyz")).toEqual([
      { text: "hello world", match: false },
    ]);
  });

  it("treats regex special characters in the query as literal text", () => {
    expect(highlightMatches("cost is $5 (approx.)", "$5 (approx.)")).toEqual([
      { text: "cost is ", match: false },
      { text: "$5 (approx.)", match: true },
    ]);
  });
});

describe("countMatches", () => {
  it("counts repeated occurrences", () => {
    expect(countMatches("bug bug bug", "bug")).toBe(3);
  });

  it("returns 0 for a blank query or no match", () => {
    expect(countMatches("hello world", "")).toBe(0);
    expect(countMatches("hello world", "xyz")).toBe(0);
  });
});

describe("buildMatchRefs", () => {
  const segments = [
    { id: "s1", text: "the bug is in the scheduler" },
    { id: "s2", text: "no bug here" },
    { id: "s3", text: "bug bug, definitely a bug" },
  ];

  it("returns one ref per match, in document order across segments", () => {
    expect(buildMatchRefs(segments, "bug")).toEqual([
      { segmentId: "s1", indexInSegment: 0 },
      { segmentId: "s2", indexInSegment: 0 },
      { segmentId: "s3", indexInSegment: 0 },
      { segmentId: "s3", indexInSegment: 1 },
      { segmentId: "s3", indexInSegment: 2 },
    ]);
  });

  it("returns an empty array for a blank query", () => {
    expect(buildMatchRefs(segments, "")).toEqual([]);
    expect(buildMatchRefs(segments, "   ")).toEqual([]);
  });

  it("returns an empty array when nothing matches", () => {
    expect(buildMatchRefs(segments, "xyz")).toEqual([]);
  });
});
