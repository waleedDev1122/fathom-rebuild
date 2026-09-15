// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsForm, type SettingsValues } from "./SettingsForm";

const fetchMock = vi.fn();

const initialSettings: SettingsValues = {
  autoRecordEnabled: true,
  autoShareEnabled: true,
  botName: "Fathom Notetaker",
  defaultTemplate: "ENHANCED",
  defaultShareAccess: "ANYONE_WITH_LINK",
};

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ json: async () => ({ ...initialSettings, id: "singleton" }) });
  vi.stubGlobal("fetch", fetchMock);
});

describe("SettingsForm", () => {
  it("renders initial values from props", () => {
    render(<SettingsForm initialSettings={initialSettings} />);

    expect(screen.getByRole("tab", { name: "All meetings" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.getByDisplayValue("Fathom Notetaker")).toBeInTheDocument();
  });

  it("saves the current form values as a PATCH to /api/settings on Save", async () => {
    const user = userEvent.setup();
    render(<SettingsForm initialSettings={initialSettings} />);

    await user.click(screen.getByRole("tab", { name: "Brief" }));
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/settings",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ ...initialSettings, defaultTemplate: "BRIEF" }),
      })
    );
  });

  it("shows a 'Saved' confirmation after a successful save", async () => {
    const user = userEvent.setup();
    render(<SettingsForm initialSettings={initialSettings} />);

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Saved")).toBeInTheDocument();
  });

  it("toggling the default template selects Brief and deselects Enhanced", async () => {
    const user = userEvent.setup();
    render(<SettingsForm initialSettings={initialSettings} />);

    const briefTab = screen.getByRole("tab", { name: "Brief" });
    await user.click(briefTab);

    expect(briefTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Enhanced" })).toHaveAttribute(
      "aria-selected",
      "false"
    );
  });

  it("updates the bot name input", async () => {
    const user = userEvent.setup();
    render(<SettingsForm initialSettings={initialSettings} />);

    const input = screen.getByDisplayValue("Fathom Notetaker");
    await user.clear(input);
    await user.type(input, "Notey");

    expect(screen.getByDisplayValue("Notey")).toBeInTheDocument();
  });
});
