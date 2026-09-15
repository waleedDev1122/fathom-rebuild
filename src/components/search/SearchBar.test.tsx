// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchBar } from "./SearchBar";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({
    json: async () => ({
      results: [
        {
          meetingId: "m1",
          title: "Team Sync",
          snippets: [
            { type: "transcript", text: "the billing migration plan", segmentId: "seg-9" },
            { type: "summary", text: "billing migration summary" },
          ],
        },
      ],
    }),
  });
  vi.stubGlobal("fetch", fetchMock);
});

describe("SearchBar", () => {
  it("links a transcript snippet to the meeting with a highlight + query param", async () => {
    const user = userEvent.setup();
    render(<SearchBar />);

    await user.type(
      screen.getByRole("searchbox", { name: "Search meetings" }),
      "billing migration"
    );

    const snippetLink = await screen.findByRole(
      "link",
      { name: "the billing migration plan" },
      { timeout: 2000 }
    );
    expect(snippetLink).toHaveAttribute(
      "href",
      "/meetings/m1?q=billing+migration&highlight=seg-9"
    );
  });

  it("links a summary snippet (no segmentId) to the meeting without a highlight param", async () => {
    const user = userEvent.setup();
    render(<SearchBar />);

    await user.type(
      screen.getByRole("searchbox", { name: "Search meetings" }),
      "billing migration"
    );

    const snippetLink = await screen.findByRole(
      "link",
      { name: "billing migration summary" },
      { timeout: 2000 }
    );
    expect(snippetLink).toHaveAttribute("href", "/meetings/m1?q=billing+migration");
  });

  it("links the result title to the meeting without a highlight param", async () => {
    const user = userEvent.setup();
    render(<SearchBar />);

    await user.type(
      screen.getByRole("searchbox", { name: "Search meetings" }),
      "billing migration"
    );

    const titleLink = await screen.findByRole("link", { name: "Team Sync" }, { timeout: 2000 });
    expect(titleLink).toHaveAttribute("href", "/meetings/m1?q=billing+migration");
  });

  it("shows 'Searching…' instead of stale results while a new query is debouncing", async () => {
    const user = userEvent.setup();
    render(<SearchBar />);

    const input = screen.getByRole("searchbox", { name: "Search meetings" });
    await user.type(input, "billing");
    await screen.findByRole("link", { name: "Team Sync" }, { timeout: 2000 });

    await user.type(input, " extra");

    expect(screen.queryByRole("link", { name: "Team Sync" })).not.toBeInTheDocument();
    expect(screen.getByText("Searching…")).toBeInTheDocument();
  });
});
