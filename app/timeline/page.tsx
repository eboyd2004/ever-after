import { PlaceholderPage } from "@/src/components/shared/placeholder-page";
import { WeddingRequiredPage } from "@/src/components/shared/wedding-required-page";

export default async function TimelinePage() {
  return (
    <WeddingRequiredPage feature="Wedding timeline">
      <PlaceholderPage
        description="See the important moments and milestones that lead to the wedding day."
        futureDescription="Wedding milestones, schedules, and day-of timing will be implemented here."
        icon="calendar"
        title="Timeline"
      />
    </WeddingRequiredPage>
  );
}
