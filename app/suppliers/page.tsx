import { PlaceholderPage } from "@/src/components/shared/placeholder-page";
import { WeddingRequiredPage } from "@/src/components/shared/wedding-required-page";

export default async function SuppliersPage() {
  return (
    <WeddingRequiredPage feature="Supplier planning">
      <PlaceholderPage
        description="Keep supplier conversations, services, and important details easy to find."
        futureDescription="Supplier records, contacts, contracts, and booking details will be implemented here."
        icon="venue"
        title="Suppliers"
      />
    </WeddingRequiredPage>
  );
}
