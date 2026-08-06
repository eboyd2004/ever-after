import Link from "next/link";

import { HouseholdCreationTrigger } from "@/src/components/guests/household-creation-trigger";
import { Icon } from "@/src/components/shared/icons";
import { PageHeader } from "@/src/components/shared/page-header";
import { Card, EmptyState } from "@/src/components/shared/ui";
import { requireWedding } from "@/src/server/auth/get-active-wedding";
import { getHouseholds } from "@/src/server/actions/guests/household.actions";
import { getGuestTags } from "@/src/server/actions/guests/guest-tag.actions";

export const dynamic = "force-dynamic";

export default async function HouseholdsPage() {
  const context = await requireWedding();
  const result = await getHouseholds();
  const tagsResult = await getGuestTags();

  if (!result.success) {
    return <HouseholdsError message={result.error} />;
  }
  if (!tagsResult.success) {
    return <HouseholdsError message={tagsResult.error} />;
  }

  const canEdit = context.role !== "VIEWER";

  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumb={<Link className="hover:text-[#2D5A27]" href="/guests">Guests / Households</Link>}
        description="Keep shared postal details together and move guests between households as plans change."
        title="Households"
        actions={
          <>
            <Link className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#E8E8E3] bg-[#F4F4F1] px-4 py-2 text-[13px] font-medium hover:bg-[#EAEAE7]" href="/guests">
              <Icon name="users" size={15} />
              Guest list
            </Link>
            {canEdit ? <HouseholdCreationTrigger tags={tagsResult.data} /> : null}
          </>
        }
      />

      {result.data.length > 0 ? (
        <section className="grid gap-4 md:grid-cols-2">
          {result.data.map((household) => (
            <Card className="p-5" key={household.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Link className="text-base font-semibold text-[#1C1C1C] hover:text-[#2D5A27]" href={`/guests/households/${household.id}`}>
                    {household.name}
                  </Link>
                  <p className="mt-1 text-sm leading-5 text-[#6B6B63]">
                    {household.addressLineOne}, {household.townCity}, {household.postcode}
                  </p>
                </div>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF0E8] text-[#2D5A27]">
                  <Icon name="pin" size={18} />
                </span>
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-[#F0EFEA] pt-4 text-xs text-[#8A8A82]">
                <span>
                  {household.guests.length} {household.guests.length === 1 ? "guest" : "guests"}
                  {household.primaryGuest ? ` · Primary: ${household.primaryGuest.firstName} ${household.primaryGuest.lastName}` : ""}
                </span>
                <Link className="font-semibold text-[#2D5A27] hover:underline" href={`/guests/households/${household.id}`}>
                  View household
                </Link>
              </div>
            </Card>
          ))}
        </section>
      ) : (
        <Card className="px-6 py-16">
          <EmptyState
            description="Create a household when two or more guests share an address."
            icon={<Icon name="pin" size={22} />}
            title="No households yet"
          />
        </Card>
      )}
    </div>
  );
}

function HouseholdsError({ message }: { message: string }) {
  return (
    <Card className="border-[#E7C9C5] bg-[#FFF5F3] p-6 text-[#5C211B]">
      <p className="text-sm font-semibold">Households unavailable</p>
      <p className="mt-2 text-sm leading-6">{message}</p>
    </Card>
  );
}
