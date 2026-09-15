import { beforeEach, describe, expect, it, vi } from "vitest";

const findUniqueMock = vi.fn();
const createMock = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    meeting: { findUnique: (...args: unknown[]) => findUniqueMock(...args) },
    highlight: { create: (...args: unknown[]) => createMock(...args) },
  },
}));

const { POST } = await import("./route");

function req(body: unknown) {
  return new Request("http://localhost/api/meetings/m1/highlights", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/meetings/[id]/highlights", () => {
  beforeEach(() => {
    findUniqueMock.mockReset();
    createMock.mockReset();
  });

  it("persists a highlight scoped to the meeting and returns it", async () => {
    findUniqueMock.mockResolvedValueOnce({ id: "m1" });
    createMock.mockResolvedValueOnce({
      id: "h1",
      meetingId: "m1",
      atSec: 42,
      note: null,
      createdAt: new Date().toISOString(),
    });

    const res = await POST(req({ atSec: 42 }), {
      params: Promise.resolve({ id: "m1" }),
    });

    expect(res.status).toBe(201);
    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { id: "m1" },
      select: { id: true },
    });
    expect(createMock).toHaveBeenCalledWith({
      data: { meetingId: "m1", atSec: 42, note: undefined },
    });
    const json = await res.json();
    expect(json).toMatchObject({ id: "h1", meetingId: "m1", atSec: 42 });
  });

  it("scopes the created highlight to the route's meeting id, ignoring any meetingId in the body", async () => {
    findUniqueMock.mockResolvedValueOnce({ id: "m2" });
    createMock.mockResolvedValueOnce({
      id: "h2",
      meetingId: "m2",
      atSec: 5,
      note: null,
      createdAt: new Date().toISOString(),
    });

    await POST(req({ atSec: 5, meetingId: "some-other-meeting" }), {
      params: Promise.resolve({ id: "m2" }),
    });

    expect(createMock).toHaveBeenCalledWith({
      data: { meetingId: "m2", atSec: 5, note: undefined },
    });
  });

  it("returns 404 and does not create a highlight when the meeting does not exist", async () => {
    findUniqueMock.mockResolvedValueOnce(null);

    const res = await POST(req({ atSec: 10 }), {
      params: Promise.resolve({ id: "missing" }),
    });

    expect(res.status).toBe(404);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("returns 400 and does not create a highlight for invalid input", async () => {
    findUniqueMock.mockResolvedValueOnce({ id: "m1" });

    const res = await POST(req({ atSec: -5 }), {
      params: Promise.resolve({ id: "m1" }),
    });

    expect(res.status).toBe(400);
    expect(createMock).not.toHaveBeenCalled();
  });
});
