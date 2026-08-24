import { PlaceholderPage } from "@/src/components/shared/placeholder-page";
import { WeddingRequiredPage } from "@/src/components/shared/wedding-required-page";

export default async function RsvpsPage() {
  return (
    <WeddingRequiredPage feature="RSVP planning">
      <PlaceholderPage
        description="Track responses and keep guest attendance details ready for the next planning step."
        futureDescription="RSVP collection, response tracking, and dietary details will be implemented here."
        icon="heart"
        title="RSVPs"
      />
    </WeddingRequiredPage>
  );
}
