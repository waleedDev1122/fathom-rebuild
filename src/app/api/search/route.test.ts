import { beforeEach, describe, expect, it, vi } from "vitest";

const searchMeetingsMock = vi.fn();

vi.mock("@/lib/search", () => ({
  searchMeetings: (...args: unknown[]) => searchMeetingsMock(...args),
}));

const { GET } = await import("./route");

beforeEach(() => {
  searchMeetingsMock.mockReset();
});

describe("GET /api/search", () => {
  it("passes the q param through to searchMeetings and returns its results", async () => {
    searchMeetingsMock.mockResolvedValueOnce([
      { meetingId: "m1", title: "Team Sync", snippets: [] },
    ]);

    const res = await GET(new Request("http://localhost/api/search?q=billing"));

    expect(searchMeetingsMock).toHaveBeenCalledWith("billing", undefined);
    const json = await res.json();
    expect(json.results).toEqual([{ meetingId: "m1", title: "Team Sync", snippets: [] }]);
  });

  it("defaults to an empty query when q is missing", async () => {
    searchMeetingsMock.mockResolvedValueOnce([]);

    await GET(new Request("http://localhost/api/search"));

    expect(searchMeetingsMock).toHaveBeenCalledWith("", undefined);
  });

  it("passes a meetingId param through to scope the search", async () => {
    searchMeetingsMock.mockResolvedValueOnce([]);

    await GET(new Request("http://localhost/api/search?q=billing&meetingId=m1"));

    expect(searchMeetingsMock).toHaveBeenCalledWith("billing", "m1");
  });
});
