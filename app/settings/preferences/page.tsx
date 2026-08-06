import { PageHeader } from "@/src/components/shared/page-header";
import { Card } from "@/src/components/shared/ui";
import { requireWedding } from "@/src/server/auth/get-active-wedding";

export const dynamic = "force-dynamic";

export default async function PreferencesSettingsPage() {
  await requireWedding();

  return (
    <div className="space-y-6">
      <PageHeader
        description="Manage your personal display and notification preferences."
        eyebrow="Account settings"
        title="Preferences"
      />
      <Card className="p-6 sm:p-8">
        <p className="text-sm leading-6 text-[#7A7A6E]">
          Personal preferences will be available here once notification and display settings are connected.
        </p>
      </Card>
    </div>
  );
}
