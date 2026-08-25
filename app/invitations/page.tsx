import { PlaceholderPage } from "@/src/components/shared/placeholder-page";
import { WeddingRequiredPage } from "@/src/components/shared/wedding-required-page";

export default async function GuestInvitationsPage() {
  return (
    <WeddingRequiredPage feature="Guest invitations">
      <PlaceholderPage
        description="Prepare guest invitation details and keep stationery planning in one place."
        futureDescription="Guest invitation planning, stationery details, and sending workflows will be implemented here."
        icon="file"
        title="Guest invitations"
      />
    </WeddingRequiredPage>
  );
}
