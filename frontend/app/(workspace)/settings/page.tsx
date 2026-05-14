import { TagTeamSettingsSection } from "@/components/settings/tag-team-settings";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-neutral-500">
          Workspace preferences and admin provisioning tools for Version&nbsp;1.
        </p>
      </div>
      <TagTeamSettingsSection />
      <Card>
        <CardHeader className="text-sm font-semibold">Theme & layout</CardHeader>
        <CardContent className="text-sm text-neutral-600 dark:text-neutral-300">
          Dark mode follows your OS preference. Side navigation stays expanded per Version 1 product guidance.
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="text-sm font-semibold">Integrations</CardHeader>
        <CardContent className="text-sm text-neutral-600 dark:text-neutral-300">
          Management dashboards, AI hiring copilots, and workflow automation will plug in through the modular service
          tier defined in HireBot Architecture.
        </CardContent>
      </Card>
    </div>
  );
}
