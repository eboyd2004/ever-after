import { PlaceholderPage } from "@/src/components/shared/placeholder-page";
import { WeddingRequiredPage } from "@/src/components/shared/wedding-required-page";

export default async function SeatingPage() {
  return (
    <WeddingRequiredPage feature="Seating plans">
      <PlaceholderPage
        description="Plan tables and make the room feel right for every guest."
        futureDescription="Seating plans, table layouts, and guest placement will be implemented here."
        icon="grid"
        title="Seating Plan"
      />
    </WeddingRequiredPage>
  );
}
