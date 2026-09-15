import { beforeEach, describe, expect, it, vi } from "vitest";

const findUniqueMock = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: { meeting: { findUnique: (...args: unknown[]) => findUniqueMock(...args) } },
}));

const { getMeetingById, getMeetingByShareSlug } = await import("./meetings");

function rawMeeting(overrides: Record<string, unknown> = {}) {
  return {
    id: "m1",
    title: "Team Sync",
    startedAt: new Date("2026-08-05T00:00:00Z"),
    durationSec: 600,
    shareSlug: "team-sync-abc123",
    participants: [{ id: "p1", name: "Maya Chen" }],
    segments: [
      {
        id: "s1",
        speakerId: "p1",
        speaker: { name: "Maya Chen" },
        startSec: 0,
        endSec: 5,
        text: "hello",
        order: 0,
      },
    ],
    summaries: [{ template: "ENHANCED", content: "summary text" }],
    actionItems: [{ id: "a1", text: "Do the thing", owner: "Maya Chen" }],
    highlights: [{ id: "h1", atSec: 12 }],
    ...overrides,
  };
}

beforeEach(() => {
  findUniqueMock.mockReset();
});

describe("getMeetingById", () => {
  it("queries by id and maps relations into a flat, UI-friendly shape", async () => {
    findUniqueMock.mockResolvedValueOnce(rawMeeting());

    const meeting = await getMeetingById("m1");

    expect(findUniqueMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "m1" } })
    );
    expect(meeting).toMatchObject({
      id: "m1",
      title: "Team Sync",
      shareSlug: "team-sync-abc123",
      participants: [{ id: "p1", name: "Maya Chen" }],
      segments: [
        {
          id: "s1",
          speakerId: "p1",
          speakerName: "Maya Chen",
          startSec: 0,
          endSec: 5,
          text: "hello",
          order: 0,
        },
      ],
      summaries: [{ template: "ENHANCED", content: "summary text" }],
      actionItems: [{ id: "a1", text: "Do the thing", owner: "Maya Chen" }],
      highlights: [{ id: "h1", atSec: 12 }],
    });
  });

  it("returns null when no meeting matches the id", async () => {
    findUniqueMock.mockResolvedValueOnce(null);
    expect(await getMeetingById("missing")).toBeNull();
  });
});

describe("getMeetingByShareSlug", () => {
  it("looks up by shareSlug alone — no session/cookie/auth input required", async () => {
    findUniqueMock.mockResolvedValueOnce(rawMeeting());

    const meeting = await getMeetingByShareSlug("team-sync-abc123");

    expect(findUniqueMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { shareSlug: "team-sync-abc123" } })
    );
    expect(meeting).toMatchObject({ id: "m1", title: "Team Sync" });
  });

  it("returns null for an unknown slug (the page 404s on this)", async () => {
    findUniqueMock.mockResolvedValueOnce(null);
    expect(await getMeetingByShareSlug("does-not-exist")).toBeNull();
  });

  it("returns only the matching meeting's own data, never another meeting's", async () => {
    findUniqueMock.mockResolvedValueOnce(
      rawMeeting({ id: "m1", title: "Meeting One", shareSlug: "slug-one" })
    );
    const first = await getMeetingByShareSlug("slug-one");

    findUniqueMock.mockResolvedValueOnce(
      rawMeeting({ id: "m2", title: "Meeting Two", shareSlug: "slug-two" })
    );
    const second = await getMeetingByShareSlug("slug-two");

    expect(first).toMatchObject({ id: "m1", title: "Meeting One", shareSlug: "slug-one" });
    expect(second).toMatchObject({ id: "m2", title: "Meeting Two", shareSlug: "slug-two" });
  });
});
