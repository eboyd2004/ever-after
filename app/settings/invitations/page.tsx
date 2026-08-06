import { PageHeader } from "@/src/components/shared/page-header";
import { InvitationManagement } from "@/src/components/settings/invitation-management";
import { Card } from "@/src/components/shared/ui";
import { requireWedding } from "@/src/server/auth/get-active-wedding";
import { listWeddingInvitations } from "@/src/server/actions/wedding/wedding.actions";

export const dynamic = "force-dynamic";

export default async function InvitationsSettingsPage() {
  const context = await requireWedding();
  const isOwner = context.role === "OWNER";
  const invitationResult = isOwner ? await listWeddingInvitations() : null;

  return (
    <div className="space-y-6">
      <PageHeader
        description="Manage pending workspace invitations for this wedding."
        eyebrow="Workspace settings"
        title="Invitations"
      />
      {isOwner ? (
        <Card className="p-5 sm:p-6">
          <InvitationManagement
            initialInvitations={invitationResult?.success ? invitationResult.data : []}
          />
        </Card>
      ) : (
        <Card className="p-6 sm:p-8">
          <p className="text-sm leading-6 text-[#7A7A6E]">
            Workspace invitations are managed by the wedding OWNER.
          </p>
        </Card>
      )}
    </div>
  );
}
