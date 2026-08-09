import Link from "next/link";

import { GuestCreationTrigger } from "@/src/components/guests/guest-creation-trigger";
import { GuestFilters } from "@/src/components/guests/guest-filters";
import { GuestTagManager } from "@/src/components/guests/guest-tag-manager";
import { GuestTable } from "@/src/components/guests/guest-table";
import { WeddingRequiredState } from "@/src/components/shared/wedding-required-state";
import { getWeddingPageContext } from "@/src/server/auth/get-wedding-page-context";
import {
  guestListRepository,
  GuestListRepositoryError,
  parseGuestListFilters,
} from "@/src/server/repositories/guest-list.repository";
import { Icon } from "@/src/components/shared/icons";
import { PageHeader } from "@/src/components/shared/page-header";
import { Badge, Card } from "@/src/components/shared/ui";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function GuestsPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const context = await getWeddingPageContext();

  if (!context) {
    return <WeddingRequiredState feature="Your guest list" />;
  }
  const params = (await searchParams) ?? {};
  const search = firstParam(params.search);
  const householdId = firstParam(params.householdId);
  const ageGroup = firstParam(params.ageGroup);
  const tagId = firstParam(params.tagId);
  const unassignedHousehold = firstParam(params.unassignedHousehold) === "true";

  const parsedFilters = parseGuestListFilters({
    search,
    householdId,
    ageGroup,
    tagId,
    unassignedHousehold,
  });

  if ("error" in parsedFilters) {
    return <GuestPageError message={parsedFilters.error} />;
  }

  let guestList;
  try {
    guestList = await guestListRepository.getGuestList(
      context.wedding.id,
      parsedFilters.value,
    );
  } catch (error) {
    const message = error instanceof GuestListRepositoryError
      ? error.message
      : "Unable to load guest data.";
    return <GuestPageError message={message} />;
  }

  const { standaloneGuests, households, tags } = guestList;
  const householdGuests = households.flatMap((household) => household.guests);
  const totalGuestCount = standaloneGuests.length + householdGuests.length;
  const unassignedCount = standaloneGuests.length;
  const childCount = [...standaloneGuests, ...householdGuests].filter((guest) => guest.ageGroup === "CHILD").length;
  const infantCount = [...standaloneGuests, ...householdGuests].filter((guest) => guest.ageGroup === "INFANT").length;
  const canEdit = context.role !== "VIEWER";

  return (
    <div className="space-y-8">
      <PageHeader
        description="Keep people, households, and guest details together as plans take shape."
        eyebrow={`${context.wedding.partnerOneName} & ${context.wedding.partnerTwoName}`}
        title="Guest list"
        actions={
          <>
            <Link
              className="inline-flex items-center justify-center gap-1.5 rounded-[10px] border border-[#E8E8E3] bg-[#F4F4F1] px-4 py-2 text-[13px] font-medium text-[#1C1C1C] hover:bg-[#EAEAE7]"
              href="/guests/households"
            >
              <Icon name="users" size={15} />
              Households
            </Link>
            {canEdit ? (
              <GuestCreationTrigger households={households} tags={tags} />
            ) : null}
          </>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total guests" value={totalGuestCount} icon="users" />
        <SummaryCard label="Households" value={households.length} icon="users" />
        <SummaryCard label="Unassigned" value={unassignedCount} icon="pin" tone={unassignedCount > 0 ? "warning" : "success"} />
        <SummaryCard label="Children & infants" value={childCount + infantCount} icon="heart" />
      </section>

      <Card className="p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <Icon name="search" size={16} />
          <h2 className="text-sm font-semibold text-[#1C1C1C]">Find a guest</h2>
        </div>
        <GuestFilters
          ageGroup={ageGroup}
          householdId={householdId}
          households={households}
          search={search}
          tagId={tagId}
          tags={tags}
          unassignedHousehold={unassignedHousehold}
        />
        <div className="mt-4 border-t border-[#F0EFEA] pt-4">
          <GuestTagManager canEdit={canEdit} tags={tags} />
        </div>
      </Card>

      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[#1C1C1C]">Invitation units</h2>
          <p className="mt-1 text-sm text-[#8A8A82]">
            {households.length} {households.length === 1 ? "household" : "households"} and {standaloneGuests.length} standalone {standaloneGuests.length === 1 ? "guest" : "guests"} matching the current view.
          </p>
        </div>
        {tags.length > 0 ? <Badge tone="success">{tags.length} wedding tags</Badge> : null}
      </div>

      <GuestTable
        canEdit={canEdit}
        households={households}
        key={`${search ?? ""}-${householdId ?? ""}-${ageGroup ?? ""}-${tagId ?? ""}-${unassignedHousehold}`}
        search={search}
        standaloneGuests={standaloneGuests}
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  tone = "default",
}: {
  label: string;
  value: number;
  icon: "users" | "pin" | "heart";
  tone?: "default" | "success" | "warning";
}) {
  const iconClass = tone === "warning" ? "bg-[#FEF9EC] text-[#B07C1A]" : tone === "success" ? "bg-[#EAF0E8] text-[#2D5A27]" : "bg-[#F4F4F1] text-[#6B6B63]";
  return (
    <Card className="flex items-center justify-between gap-4 p-5">
      <div>
        <p className="text-xs text-[#8A8A82]">{label}</p>
        <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#1C1C1C]">{value}</p>
      </div>
      <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}>
        <Icon name={icon} size={20} />
      </span>
    </Card>
  );
}

function GuestPageError({ message }: { message: string }) {
  return (
    <Card className="border-[#E7C9C5] bg-[#FFF5F3] p-6 text-[#5C211B]">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-red-700">Guest list unavailable</p>
      <h1 className="mt-2 text-2xl font-semibold">We could not load your guests</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-red-900">{message}</p>
    </Card>
  );
}
