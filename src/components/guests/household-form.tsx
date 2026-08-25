"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

import {
  createHousehold,
  deleteHousehold,
  updateHousehold,
  type HouseholdActionResult,
  type HouseholdData,
} from "@/src/server/actions/guests/household.actions";
import { Button } from "@/src/components/shared/ui";
import { ConfirmDialog } from "@/src/components/shared/confirm-dialog";

export function HouseholdForm({ household }: { household?: HouseholdData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const input = {
      name: formData.get("name"),
      addressLineOne: formData.get("addressLineOne"),
      addressLineTwo: formData.get("addressLineTwo"),
      townCity: formData.get("townCity"),
      countyRegion: formData.get("countyRegion"),
      postcode: formData.get("postcode"),
      country: formData.get("country"),
      notes: formData.get("notes"),
    };

    startTransition(async () => {
      const result: HouseholdActionResult<HouseholdData> = household
        ? await updateHousehold(household.id, input)
        : await createHousehold(input);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setMessage(household ? "Household details saved." : "Household created.");
      if (!household) form.reset();
    });
  }

  function remove() {
    if (!household) return;

    setError(null);
    startTransition(async () => {
      const result = await deleteHousehold(household.id);
      if (!result.success) {
        setError(result.error);
        return;
      }

      setIsDeleteOpen(false);
      router.push("/guests/households");
    });
  }

  return (
    <form className="space-y-5" onSubmit={submit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Household name" name="name" required defaultValue={household?.name ?? ""} />
        <Field label="Country" name="country" required defaultValue={household?.country ?? "United Kingdom"} />
        <Field label="Address line one" name="addressLineOne" required defaultValue={household?.addressLineOne ?? ""} />
        <Field label="Address line two" name="addressLineTwo" defaultValue={household?.addressLineTwo ?? ""} />
        <Field label="Town or city" name="townCity" required defaultValue={household?.townCity ?? ""} />
        <Field label="County or region" name="countyRegion" defaultValue={household?.countyRegion ?? ""} />
        <Field label="Postcode" name="postcode" required defaultValue={household?.postcode ?? ""} />
      </div>
      <label className="grid gap-1.5 text-xs font-medium text-[#6B6B63]">
        Notes
        <textarea
          className="min-h-24 rounded-[10px] border border-[#E8E8E3] bg-white px-3 py-2 text-sm text-[#1C1C1C] outline-none focus:border-[#2D5A27] focus:ring-2 focus:ring-[#EAF0E8]"
          defaultValue={household?.notes ?? ""}
          name="notes"
        />
      </label>
      {error ? <p className="text-sm text-[#9D3F32]">{error}</p> : null}
      {message ? <p className="text-sm text-[#2D5A27]">{message}</p> : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {household ? (
          <Button
            className="text-[#9D3F32] hover:bg-[#FFF5F3]"
            disabled={isPending}
            onClick={() => setIsDeleteOpen(true)}
            type="button"
            variant="ghost"
          >
            Delete household
          </Button>
        ) : <span />}
        <Button disabled={isPending} type="submit" variant="primary">
          {isPending ? "Saving…" : household ? "Save household" : "Create household"}
        </Button>
      </div>
      {household ? (
        <ConfirmDialog
          confirmLabel="Delete household"
          description="The household will be deleted, but its guests will remain in the wedding without a household."
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={remove}
          open={isDeleteOpen}
          pending={isPending}
          title={`Delete ${household.name}?`}
        />
      ) : null}
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required = false,
}: {
  label: string;
  name: string;
  defaultValue: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1.5 text-xs font-medium text-[#6B6B63]">
      {label}
      <input
        className="h-10 rounded-[10px] border border-[#E8E8E3] bg-white px-3 text-sm text-[#1C1C1C] outline-none focus:border-[#2D5A27] focus:ring-2 focus:ring-[#EAF0E8]"
        defaultValue={defaultValue}
        name={name}
        required={required}
      />
    </label>
  );
}
