import { beforeEach, describe, expect, it, vi } from "vitest";

const findManySegmentsMock = vi.fn();
const findManySummariesMock = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    transcriptSegment: { findMany: (...args: unknown[]) => findManySegmentsMock(...args) },
    summary: { findMany: (...args: unknown[]) => findManySummariesMock(...args) },
  },
}));

const { searchMeetings, excerpt } = await import("./search");

beforeEach(() => {
  findManySegmentsMock.mockReset();
  findManySummariesMock.mockReset();
  findManySegmentsMock.mockResolvedValue([]);
  findManySummariesMock.mockResolvedValue([]);
});

describe("excerpt", () => {
  it("centers a short excerpt around the match with ellipses", () => {
    const text = `${"x".repeat(100)} billing migration ${"y".repeat(100)}`;
    const result = excerpt(text, "billing migration", 10);
    expect(result.startsWith("…")).toBe(true);
    expect(result.endsWith("…")).toBe(true);
    expect(result).toContain("billing migration");
  });

  it("returns the text unchanged when it's already short and matches", () => {
    expect(excerpt("short billing note", "billing")).toBe("short billing note");
  });
});

describe("searchMeetings", () => {
  it("returns an empty array for a blank query without hitting the database", async () => {
    const results = await searchMeetings("   ");
    expect(results).toEqual([]);
    expect(findManySegmentsMock).not.toHaveBeenCalled();
    expect(findManySummariesMock).not.toHaveBeenCalled();
  });

  it("queries transcript text and summary content case-insensitively (ILIKE)", async () => {
    await searchMeetings("billing migration");

    expect(findManySegmentsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { text: { contains: "billing migration", mode: "insensitive" } },
      })
    );
    expect(findManySummariesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { content: { contains: "billing migration", mode: "insensitive" } },
      })
    );
  });

  it("finds the 1:1 and the quarterly planning meeting for 'billing migration', which both discuss it", async () => {
    findManySegmentsMock.mockResolvedValueOnce([
      {
        meetingId: "m-1on1",
        meeting: { title: "Weekly 1:1 — Jordan & Sam" },
        text: "Honestly a bit nervous. The old invoicing table doesn't have clean foreign keys, so the backfill script is going to need a lot of validation before we run it against prod.",
      },
      {
        meetingId: "m-q3",
        meeting: { title: "Q3 Planning & Roadmap Review" },
        text: "Sure. Short version — the old invoicing table has messier data than we expected.",
      },
    ]);

    const results = await searchMeetings("billing migration");

    expect(results.map((r) => r.meetingId).sort()).toEqual(["m-1on1", "m-q3"]);
  });

  it("includes the segment id on transcript snippets so callers can jump to it", async () => {
    findManySegmentsMock.mockResolvedValueOnce([
      {
        id: "seg-42",
        meetingId: "m1",
        meeting: { title: "Team Sync" },
        text: "the timezone bug in the scheduler",
      },
    ]);

    const results = await searchMeetings("timezone bug");

    expect(results[0].snippets[0]).toMatchObject({ type: "transcript", segmentId: "seg-42" });
  });

  it("merges transcript and summary matches for the same meeting into one result", async () => {
    findManySegmentsMock.mockResolvedValueOnce([
      { meetingId: "m1", meeting: { title: "Team Sync" }, text: "the timezone bug in the scheduler" },
    ]);
    findManySummariesMock.mockResolvedValueOnce([
      { meetingId: "m1", meeting: { title: "Team Sync" }, content: "fixed the timezone bug" },
    ]);

    const results = await searchMeetings("timezone bug");

    expect(results).toHaveLength(1);
    expect(results[0].snippets.map((s) => s.type).sort()).toEqual(["summary", "transcript"]);
  });

  it("caps snippets per meeting rather than growing unbounded", async () => {
    findManySegmentsMock.mockResolvedValueOnce(
      Array.from({ length: 10 }, (_, i) => ({
        meetingId: "m1",
        meeting: { title: "Team Sync" },
        text: `export job mention number ${i}`,
      }))
    );

    const results = await searchMeetings("export job");

    expect(results[0].snippets.length).toBeLessThanOrEqual(3);
  });

  it("returns no results for a query that matches nothing", async () => {
    const results = await searchMeetings("some completely unrelated phrase xyz");
    expect(results).toEqual([]);
  });

  it("scopes both queries to a meetingId when one is given", async () => {
    await searchMeetings("billing migration", "m1");

    expect(findManySegmentsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { text: { contains: "billing migration", mode: "insensitive" }, meetingId: "m1" },
      })
    );
    expect(findManySummariesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          content: { contains: "billing migration", mode: "insensitive" },
          meetingId: "m1",
        },
      })
    );
  });

  it("does not add a meetingId filter when none is given", async () => {
    await searchMeetings("billing migration");

    expect(findManySegmentsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { text: { contains: "billing migration", mode: "insensitive" } },
      })
    );
  });
});
