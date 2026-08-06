import { PageHeader } from "@/src/components/shared/page-header";
import { Card } from "@/src/components/shared/ui";
import { WeddingLocationsForm } from "@/src/components/settings/wedding-locations-form";
import { requireWedding } from "@/src/server/auth/get-active-wedding";
import { getWeddingLocations } from "@/src/server/actions/settings/wedding-settings.actions";

export const dynamic = "force-dynamic";

export default async function LocationsSettingsPage() {
  const context = await requireWedding();
  const result = await getWeddingLocations();

  return (
    <div className="space-y-6">
      <PageHeader
        description="Keep the ceremony and reception locations visible to everyone planning this wedding."
        eyebrow="Wedding settings"
        title="Locations"
      />
      {result.success ? (
        <WeddingLocationsForm
          initialData={result.data}
          readOnly={context.role === "VIEWER"}
        />
      ) : (
        <Card className="border-[#E7C9C5] bg-[#FFF8F6] p-5 sm:p-6">
          <h2 className="text-base font-semibold text-[#5C211B]">Unable to load locations</h2>
          <p className="mt-2 text-sm leading-6 text-[#7A4A43]">{result.error}</p>
        </Card>
      )}
    </div>
  );
}
