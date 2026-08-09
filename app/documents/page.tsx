import { PlaceholderPage } from "@/src/components/shared/placeholder-page";
import { WeddingRequiredPage } from "@/src/components/shared/wedding-required-page";

export default async function DocumentsPage() {
  return (
    <WeddingRequiredPage feature="Wedding documents">
      <PlaceholderPage
        description="Keep contracts, inspiration, and planning documents close to the decisions they support."
        futureDescription="Shared wedding documents and file organisation will be implemented here."
        icon="file"
        title="Documents"
      />
    </WeddingRequiredPage>
  );
}
