import { getSettings } from "@/lib/settings";
import { SettingsForm } from "@/components/settings/SettingsForm";

// Must reflect the latest saved values on every load, not a build-time snapshot.
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-foreground-muted">
          Defaults applied across your meetings.
        </p>
      </div>

      <SettingsForm
        initialSettings={{
          autoRecordEnabled: settings.autoRecordEnabled,
          autoShareEnabled: settings.autoShareEnabled,
          botName: settings.botName,
          defaultTemplate: settings.defaultTemplate,
          defaultShareAccess: settings.defaultShareAccess,
        }}
      />
    </div>
  );
}
