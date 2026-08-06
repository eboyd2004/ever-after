import Link from "next/link";

import type { GuestTagActionData } from "@/src/server/actions/guests/guest.actions";
import type { HouseholdData } from "@/src/server/actions/guests/household.actions";
import { Button, Input, Select } from "@/src/components/shared/ui";

export function GuestFilters({
  search,
  householdId,
  ageGroup,
  tagId,
  unassignedHousehold,
  households,
  tags,
}: {
  search?: string;
  householdId?: string;
  ageGroup?: string;
  tagId?: string;
  unassignedHousehold?: boolean;
  households: HouseholdData[];
  tags: GuestTagActionData[];
}) {
  return (
    <form className="grid gap-3 lg:grid-cols-[minmax(220px,1.5fr)_1fr_1fr_1fr_auto]" method="get">
      <Input defaultValue={search} name="search" placeholder="Search guests or households…" />
      <Select defaultValue={householdId} name="householdId">
        <option value="">All households</option>
        {households.map((household) => (
          <option key={household.id} value={household.id}>
            {household.name}
          </option>
        ))}
      </Select>
      <Select defaultValue={ageGroup} name="ageGroup">
        <option value="">All age groups</option>
        <option value="ADULT">Adults</option>
        <option value="CHILD">Children</option>
        <option value="INFANT">Infants</option>
      </Select>
      <Select defaultValue={tagId} name="tagId">
        <option value="">All tags</option>
        {tags.map((tag) => (
          <option key={tag.id} value={tag.id}>
            {tag.name}
          </option>
        ))}
      </Select>
      <div className="flex items-center gap-2">
        <label className="flex h-10 items-center gap-2 whitespace-nowrap rounded-[10px] border border-[#E8E8E3] bg-white px-3 text-xs text-[#6B6B63]">
          <input defaultChecked={unassignedHousehold} name="unassignedHousehold" type="checkbox" value="true" />
          Unassigned
        </label>
        <Button type="submit" variant="secondary">
          Filter
        </Button>
        <Link
          className="hidden text-xs font-medium text-[#6B6B63] hover:text-[#2D5A27] sm:inline"
          href="/guests"
        >
          Clear
        </Link>
      </div>
    </form>
  );
}
