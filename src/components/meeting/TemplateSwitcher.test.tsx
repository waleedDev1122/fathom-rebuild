// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TemplateSwitcher } from "./TemplateSwitcher";

const summaries = [
  { template: "ENHANCED" as const, content: "## Overview\nEnhanced summary text." },
  { template: "BRIEF" as const, content: "Brief summary text." },
];
const actionItems = [{ id: "a1", text: "Do the thing", owner: "Sam" }];

describe("TemplateSwitcher", () => {
  it("shows the ENHANCED summary by default", () => {
    render(<TemplateSwitcher summaries={summaries} actionItems={actionItems} />);
    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Enhanced summary text.")).toBeInTheDocument();
  });

  it("switches to the BRIEF summary when its tab is clicked", async () => {
    const user = userEvent.setup();
    render(<TemplateSwitcher summaries={summaries} actionItems={actionItems} />);

    await user.click(screen.getByRole("tab", { name: "Brief" }));

    expect(screen.getByText("Brief summary text.")).toBeInTheDocument();
    expect(screen.queryByText("Enhanced summary text.")).not.toBeInTheDocument();
  });

  it("marks the selected tab via aria-selected", async () => {
    const user = userEvent.setup();
    render(<TemplateSwitcher summaries={summaries} actionItems={actionItems} />);

    expect(screen.getByRole("tab", { name: "Enhanced" })).toHaveAttribute(
      "aria-selected",
      "true"
    );

    await user.click(screen.getByRole("tab", { name: "Brief" }));

    expect(screen.getByRole("tab", { name: "Brief" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.getByRole("tab", { name: "Enhanced" })).toHaveAttribute(
      "aria-selected",
      "false"
    );
  });

  it("renders action items with their owner", () => {
    render(<TemplateSwitcher summaries={summaries} actionItems={actionItems} />);
    expect(screen.getByText(/Do the thing/)).toBeInTheDocument();
    expect(screen.getByText(/Sam/)).toBeInTheDocument();
  });

  it("omits the action items section when there are none", () => {
    render(<TemplateSwitcher summaries={summaries} actionItems={[]} />);
    expect(screen.queryByText("Action items")).not.toBeInTheDocument();
  });

  it("shows an empty state instead of a blank tablist when there are no summaries", () => {
    render(<TemplateSwitcher summaries={[]} actionItems={[]} />);
    expect(screen.getByText("No summary yet")).toBeInTheDocument();
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
  });
});
