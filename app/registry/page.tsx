import { PlaceholderPage } from "@/src/components/shared/placeholder-page";
import { WeddingRequiredPage } from "@/src/components/shared/wedding-required-page";

export default async function RegistryPage() {
  return (
    <WeddingRequiredPage feature="Gift registry planning">
      <PlaceholderPage
        description="Collect gift ideas and share the things that will help you start your next chapter."
        futureDescription="Gift registry links and registry planning will be implemented here."
        icon="gift"
        title="Gift Registry"
      />
    </WeddingRequiredPage>
  );
}
