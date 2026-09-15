"use client";

import { useState } from "react";

type SummaryTemplate = "ENHANCED" | "BRIEF";
type ShareAccess = "ANYONE_WITH_LINK" | "MEETING_PARTICIPANTS_ONLY";

export type SettingsValues = {
  autoRecordEnabled: boolean;
  autoShareEnabled: boolean;
  botName: string;
  defaultTemplate: SummaryTemplate;
  defaultShareAccess: ShareAccess;
};

const TEMPLATE_LABELS: Record<SummaryTemplate, string> = {
  ENHANCED: "Enhanced",
  BRIEF: "Brief",
};

const SHARE_ACCESS_LABELS: Record<ShareAccess, string> = {
  ANYONE_WITH_LINK: "Anyone with the link",
  MEETING_PARTICIPANTS_ONLY: "Meeting participants only",
};

function ToggleGroup<T extends string>({
  label,
  value,
  options,
  labels,
  onChange,
}: {
  label: string;
  value: T;
  options: T[];
  labels: Record<T, string>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="flex gap-2" role="tablist" aria-label={label}>
        {options.map((option) => (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={value === option}
            onClick={() => onChange(option)}
            className={value === option ? "btn btn-primary" : "btn btn-secondary"}
          >
            {labels[option]}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SettingsForm({ initialSettings }: { initialSettings: SettingsValues }) {
  const [values, setValues] = useState<SettingsValues>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof SettingsValues>(key: K, value: SettingsValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card flex flex-col gap-6">
      <ToggleGroup
        label="Auto-record meetings"
        value={values.autoRecordEnabled ? "on" : "off"}
        options={["on", "off"]}
        labels={{ on: "All meetings", off: "Off" }}
        onChange={(v) => set("autoRecordEnabled", v === "on")}
      />

      <ToggleGroup
        label="Auto-share summary + recording"
        value={values.autoShareEnabled ? "on" : "off"}
        options={["on", "off"]}
        labels={{ on: "On", off: "Off" }}
        onChange={(v) => set("autoShareEnabled", v === "on")}
      />

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-foreground">Bot name</span>
        <input
          type="text"
          value={values.botName}
          onChange={(e) => set("botName", e.target.value)}
          className="w-full rounded-default border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        />
      </label>

      <ToggleGroup
        label="Default summary template"
        value={values.defaultTemplate}
        options={["ENHANCED", "BRIEF"] as SummaryTemplate[]}
        labels={TEMPLATE_LABELS}
        onChange={(v) => set("defaultTemplate", v)}
      />

      <ToggleGroup
        label="Default share-link access"
        value={values.defaultShareAccess}
        options={["ANYONE_WITH_LINK", "MEETING_PARTICIPANTS_ONLY"] as ShareAccess[]}
        labels={SHARE_ACCESS_LABELS}
        onChange={(v) => set("defaultShareAccess", v)}
      />

      <div className="flex items-center gap-3 border-t border-border pt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        {saved && <span className="text-sm text-success">Saved</span>}
      </div>
    </div>
  );
}
