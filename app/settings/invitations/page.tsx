import { PageHeader } from "@/src/components/shared/page-header";
import { WorkspaceInvitationManagement } from "@/src/components/settings/workspace-invitation-management";
import { Card } from "@/src/components/shared/ui";
import { WeddingRequiredState } from "@/src/components/shared/wedding-required-state";
import { getWeddingPageContext } from "@/src/server/auth/get-wedding-page-context";
import { listWeddingMemberInvitations } from "@/src/server/actions/wedding/workspace-invitation.actions";

export const dynamic = "force-dynamic";

export default async function WorkspaceInvitationsSettingsPage() {
  const context = await getWeddingPageContext();

  if (!context) {
    return <WeddingRequiredState feature="Workspace invitations" />;
  }

  const isOwner = context.role === "OWNER";
  const memberInvitationResult = isOwner ? await listWeddingMemberInvitations() : null;

  return (
    <div className="space-y-6">
      <PageHeader
        description="Manage pending workspace invitations for this wedding."
        eyebrow="Workspace settings"
        title="Member invitations"
      />
      {isOwner ? (
        <Card className="p-5 sm:p-6">
          <WorkspaceInvitationManagement
            initialMemberInvitations={memberInvitationResult?.success ? memberInvitationResult.data : []}
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
