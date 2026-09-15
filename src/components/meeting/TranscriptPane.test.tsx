// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TranscriptPane } from "./TranscriptPane";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

const segments = [
  {
    id: "seg-1",
    speakerId: "sp-1",
    speakerName: "Jordan",
    startSec: 0,
    endSec: 10,
    text: "Let's talk about the billing migration timeline.",
    order: 0,
  },
  {
    id: "seg-2",
    speakerId: "sp-2",
    speakerName: "Sam",
    startSec: 10,
    endSec: 20,
    text: "Sure, the billing migration is on track.",
    order: 1,
  },
];

beforeEach(() => {
  refreshMock.mockReset();
  Element.prototype.scrollIntoView = vi.fn();
});

describe("TranscriptPane", () => {
  it("shows an empty state instead of a blank pane when there are no segments", () => {
    render(<TranscriptPane meetingId="m1" segments={[]} highlights={[]} />);
    expect(screen.getByText("No transcript available")).toBeInTheDocument();
  });

  it("renders each speaker's segments", () => {
    render(<TranscriptPane meetingId="m1" segments={segments} highlights={[]} />);
    expect(screen.getByText("Jordan")).toBeInTheDocument();
    expect(screen.getByText("Sam")).toBeInTheDocument();
    expect(screen.getByText(/billing migration timeline/)).toBeInTheDocument();
  });

  it("shows no match count and no <mark> elements without a search query", () => {
    const { container } = render(
      <TranscriptPane meetingId="m1" segments={segments} highlights={[]} />
    );
    expect(screen.queryByText(/match/)).not.toBeInTheDocument();
    expect(container.querySelectorAll("mark")).toHaveLength(0);
  });

  it("highlights every occurrence of the searched keyword across the transcript", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <TranscriptPane meetingId="m1" segments={segments} highlights={[]} />
    );

    await user.type(
      screen.getByRole("searchbox", { name: "Search this transcript" }),
      "billing migration"
    );

    expect(screen.getByText("1 of 2")).toBeInTheDocument();
    const marks = container.querySelectorAll("mark");
    expect(marks).toHaveLength(2);
    marks.forEach((mark) => expect(mark.textContent?.toLowerCase()).toBe("billing migration"));
  });

  it("prefills the search from initialSearchQuery, e.g. arriving from global search", () => {
    render(
      <TranscriptPane
        meetingId="m1"
        segments={segments}
        highlights={[]}
        initialSearchQuery="billing migration"
      />
    );
    expect(screen.getByRole("searchbox")).toHaveValue("billing migration");
    expect(screen.getByText("1 of 2")).toBeInTheDocument();
  });

  it("scrolls to and flashes the jumped-to segment on mount", () => {
    render(
      <TranscriptPane
        meetingId="m1"
        segments={segments}
        highlights={[]}
        jumpToSegmentId="seg-2"
      />
    );

    const target = document.getElementById("segment-seg-2");
    expect(target).toHaveClass("highlight-flash");
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it("steps to the next and previous match, wrapping around at the ends", async () => {
    const user = userEvent.setup();
    render(
      <TranscriptPane
        meetingId="m1"
        segments={segments}
        highlights={[]}
        initialSearchQuery="billing migration"
      />
    );

    expect(screen.getByText("1 of 2")).toBeInTheDocument();
    expect(document.getElementById("match-0")).toHaveClass("bg-brand");

    await user.click(screen.getByRole("button", { name: "Next match" }));
    expect(screen.getByText("2 of 2")).toBeInTheDocument();
    expect(document.getElementById("match-1")).toHaveClass("bg-brand");

    await user.click(screen.getByRole("button", { name: "Next match" }));
    expect(screen.getByText("1 of 2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Previous match" }));
    expect(screen.getByText("2 of 2")).toBeInTheDocument();
  });

  it("steps to the next match on Enter and the previous on Shift+Enter", async () => {
    const user = userEvent.setup();
    render(
      <TranscriptPane
        meetingId="m1"
        segments={segments}
        highlights={[]}
        initialSearchQuery="billing migration"
      />
    );

    const input = screen.getByRole("searchbox", { name: "Search this transcript" });
    await user.type(input, "{Enter}");
    expect(screen.getByText("2 of 2")).toBeInTheDocument();

    await user.type(input, "{Shift>}{Enter}{/Shift}");
    expect(screen.getByText("1 of 2")).toBeInTheDocument();
  });

  it("shows 'No matches' and disables next/previous when the query matches nothing", async () => {
    const user = userEvent.setup();
    render(<TranscriptPane meetingId="m1" segments={segments} highlights={[]} />);

    await user.type(
      screen.getByRole("searchbox", { name: "Search this transcript" }),
      "xyz not present"
    );

    expect(screen.getByText("No matches")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next match" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Previous match" })).toBeDisabled();
  });

  it("hides the highlight-creation button in read-only mode", () => {
    render(
      <TranscriptPane meetingId="m1" segments={segments} highlights={[]} readOnly />
    );
    expect(
      screen.queryByRole("button", { name: "Highlight this moment" })
    ).not.toBeInTheDocument();
  });

  it("still shows already-created highlights (non-interactively) in read-only mode", () => {
    render(
      <TranscriptPane
        meetingId="m1"
        segments={segments}
        highlights={[{ id: "h1", atSec: 0 }]}
        readOnly
      />
    );
    expect(screen.getByLabelText("Highlighted")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Highlighted" })).not.toBeInTheDocument();
  });

  it("starts the active match on the jumped-to segment, not always the first match", () => {
    render(
      <TranscriptPane
        meetingId="m1"
        segments={segments}
        highlights={[]}
        initialSearchQuery="billing migration"
        jumpToSegmentId="seg-2"
      />
    );

    expect(screen.getByText("2 of 2")).toBeInTheDocument();
  });
});
