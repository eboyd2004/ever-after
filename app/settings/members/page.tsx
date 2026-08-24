import { PageHeader } from "@/src/components/shared/page-header";
import { Card } from "@/src/components/shared/ui";
import { WeddingRequiredState } from "@/src/components/shared/wedding-required-state";
import { getWeddingPageContext } from "@/src/server/auth/get-wedding-page-context";

export const dynamic = "force-dynamic";

export default async function MembersSettingsPage() {
  const context = await getWeddingPageContext();

  if (!context) {
    return <WeddingRequiredState feature="Wedding members" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description="Manage owners, editors, and viewers for this wedding workspace."
        eyebrow="Workspace settings"
        title="Members"
      />
      <PlaceholderCard title="Member management is not available in this private alpha." />
    </div>
  );
}

function PlaceholderCard({ title }: { title: string }) {
  return (
    <Card className="p-6 sm:p-8">
      <p className="text-sm leading-6 text-[#7A7A6E]">
        {title} This area will be connected to the wedding membership and invitation flow.
      </p>
    </Card>
  );
}
