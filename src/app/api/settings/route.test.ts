import { beforeEach, describe, expect, it, vi } from "vitest";

const upsertMock = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: { settings: { upsert: (...args: unknown[]) => upsertMock(...args) } },
}));

const { GET, PATCH } = await import("./route");

function patchReq(body: unknown) {
  return new Request("http://localhost/api/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  upsertMock.mockReset();
});

describe("GET /api/settings", () => {
  it("returns the settings row", async () => {
    upsertMock.mockResolvedValueOnce({ id: "singleton", autoRecordEnabled: true });

    const res = await GET();

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toMatchObject({ id: "singleton", autoRecordEnabled: true });
  });
});

describe("PATCH /api/settings", () => {
  it("persists a valid partial update and returns the result", async () => {
    upsertMock.mockResolvedValueOnce({ id: "singleton", botName: "Notey" });

    const res = await PATCH(patchReq({ botName: "Notey" }));

    expect(res.status).toBe(200);
    expect(upsertMock).toHaveBeenCalledWith({
      where: { id: "singleton" },
      update: { botName: "Notey" },
      create: { id: "singleton", botName: "Notey" },
    });
    const json = await res.json();
    expect(json).toMatchObject({ botName: "Notey" });
  });

  it("returns 400 and does not persist for invalid input", async () => {
    const res = await PATCH(patchReq({ defaultTemplate: "SHORT" }));

    expect(res.status).toBe(400);
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it("returns 400 for a non-JSON body", async () => {
    const res = await PATCH(
      new Request("http://localhost/api/settings", { method: "PATCH", body: "not json" })
    );

    expect(res.status).toBe(400);
    expect(upsertMock).not.toHaveBeenCalled();
  });
});
