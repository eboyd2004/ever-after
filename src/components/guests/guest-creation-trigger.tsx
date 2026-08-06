"use client";

import { useState } from "react";

import type { HouseholdData } from "@/src/server/actions/guests/household.actions";
import { Button } from "@/src/components/shared/ui";
import { Icon } from "@/src/components/shared/icons";
import { GuestCreationModal } from "./guest-creation-modal";

export function GuestCreationTrigger({
  households,
  tags,
  buttonLabel = "Add guest",
  lockedHouseholdId,
}: {
  households: Pick<HouseholdData, "id" | "name">[];
  tags: { id: string; name: string; colour: string | null }[];
  buttonLabel?: string;
  lockedHouseholdId?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="primary">
        <Icon name="plus" size={15} />
        {buttonLabel}
      </Button>
      <GuestCreationModal
        households={households}
        lockedHouseholdId={lockedHouseholdId}
        onClose={() => setOpen(false)}
        open={open}
        tags={tags}
      />
    </>
  );
}
