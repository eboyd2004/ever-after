import { PlaceholderPage } from "@/src/components/shared/placeholder-page";
import { WeddingRequiredPage } from "@/src/components/shared/wedding-required-page";

export default async function BudgetPage() {
  return (
    <WeddingRequiredPage feature="Budget planning">
      <PlaceholderPage
        description="Keep spending decisions clear while the wedding comes together."
        futureDescription="Budget categories, expenses, and payments will be managed here."
        icon="dollar"
        title="Budget"
      />
    </WeddingRequiredPage>
  );
}
