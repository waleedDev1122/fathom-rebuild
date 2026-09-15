import { beforeEach, describe, expect, it, vi } from "vitest";

const upsertMock = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: { settings: { upsert: (...args: unknown[]) => upsertMock(...args) } },
}));

const { getSettings, updateSettings, SETTINGS_ID, UpdateSettingsInputSchema } = await import(
  "./settings"
);

beforeEach(() => {
  upsertMock.mockReset();
});

describe("getSettings", () => {
  it("upserts the singleton row, creating defaults if it doesn't exist yet", async () => {
    upsertMock.mockResolvedValueOnce({ id: SETTINGS_ID, autoRecordEnabled: true });

    await getSettings();

    expect(upsertMock).toHaveBeenCalledWith({
      where: { id: SETTINGS_ID },
      update: {},
      create: { id: SETTINGS_ID },
    });
  });
});

describe("updateSettings", () => {
  it("merges a partial update into the singleton row", async () => {
    upsertMock.mockResolvedValueOnce({ id: SETTINGS_ID, botName: "Notey" });

    await updateSettings({ botName: "Notey" });

    expect(upsertMock).toHaveBeenCalledWith({
      where: { id: SETTINGS_ID },
      update: { botName: "Notey" },
      create: { id: SETTINGS_ID, botName: "Notey" },
    });
  });
});

describe("UpdateSettingsInputSchema", () => {
  it("accepts an empty object (all fields optional)", () => {
    expect(UpdateSettingsInputSchema.safeParse({}).success).toBe(true);
  });

  it("accepts a full valid payload", () => {
    const result = UpdateSettingsInputSchema.safeParse({
      autoRecordEnabled: false,
      autoShareEnabled: true,
      botName: "Fathom Notetaker",
      defaultTemplate: "BRIEF",
      defaultShareAccess: "MEETING_PARTICIPANTS_ONLY",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid defaultTemplate value", () => {
    expect(UpdateSettingsInputSchema.safeParse({ defaultTemplate: "SHORT" }).success).toBe(false);
  });

  it("rejects an empty bot name", () => {
    expect(UpdateSettingsInputSchema.safeParse({ botName: "" }).success).toBe(false);
  });
});
