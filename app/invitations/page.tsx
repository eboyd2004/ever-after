import { PlaceholderPage } from "@/src/components/shared/placeholder-page";
import { WeddingRequiredPage } from "@/src/components/shared/wedding-required-page";

export default async function InvitationsPage() {
  return (
    <WeddingRequiredPage feature="Invitation planning">
      <PlaceholderPage
        description="Prepare invitation details and keep stationery planning in one place."
        futureDescription="Invitation planning, stationery details, and sending workflows will be implemented here."
        icon="file"
        title="Invitations"
      />
    </WeddingRequiredPage>
  );
}
