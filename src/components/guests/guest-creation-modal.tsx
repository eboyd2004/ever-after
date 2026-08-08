"use client";

import { FormEvent, useRef, useState, useTransition, type ReactNode } from "react";

import { createGuest, type GuestActionResult, type GuestActionData } from "@/src/server/actions/guests/guest.actions";
import type { HouseholdData } from "@/src/server/actions/guests/household.actions";
import type { GuestListTag } from "@/src/server/repositories/guest-list.repository";
import { Button, Input, Select } from "@/src/components/shared/ui";
import { Modal } from "@/src/components/shared/modal";
import { ConfirmDialog } from "@/src/components/shared/confirm-dialog";

type PlusOneDraft = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  ageGroup: string;
  dietaryRequirements: string;
  notes: string;
};

const emptyPlusOne: PlusOneDraft = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  ageGroup: "ADULT",
  dietaryRequirements: "",
  notes: "",
};

export function GuestCreationModal({
  open,
  onClose,
  households,
  tags,
  lockedHouseholdId,
}: {
  open: boolean;
  onClose: () => void;
  households: Pick<HouseholdData, "id" | "name">[];
  tags: GuestListTag[];
  lockedHouseholdId?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [plusOneOpen, setPlusOneOpen] = useState(false);
  const [plusOneDraft, setPlusOneDraft] = useState<PlusOneDraft>(emptyPlusOne);
  const [confirmation, setConfirmation] = useState<"close" | "collapse" | null>(null);

  function close() {
    if (hasPlusOneDraft(plusOneDraft)) {
      setConfirmation("close");
      return;
    }
    performClose();
  }

  function performClose() {
    formRef.current?.reset();
    setError(null);
    setPlusOneOpen(false);
    setPlusOneDraft(emptyPlusOne);
    setConfirmation(null);
    onClose();
  }

  function togglePlusOne() {
    if (plusOneOpen && hasPlusOneDraft(plusOneDraft)) {
      setConfirmation("collapse");
      return;
    }

    setPlusOneOpen((current) => !current);
    if (plusOneOpen) setPlusOneDraft(emptyPlusOne);
  }

  function confirmDiscard() {
    if (confirmation === "close") {
      performClose();
      return;
    }

    setPlusOneOpen(false);
    setPlusOneDraft(emptyPlusOne);
    setConfirmation(null);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const tagIds = formData
      .getAll("tagIds")
      .filter((tagId): tagId is string => typeof tagId === "string");

    startTransition(async () => {
      const result: GuestActionResult<GuestActionData> = await createGuest({
        title: formData.get("title"),
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        ageGroup: formData.get("ageGroup"),
        householdId: lockedHouseholdId ?? formData.get("householdId"),
        dietaryRequirements: formData.get("dietaryRequirements"),
        notes: formData.get("notes"),
        tagIds,
        plusOne: plusOneOpen ? plusOneDraft : undefined,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      form.reset();
      setPlusOneDraft(emptyPlusOne);
      setPlusOneOpen(false);
      close();
    });
  }

  return (
    <>
      <Modal
        description="Add a primary guest and optionally their plus-one."
        onClose={close}
        open={open && confirmation === null}
        title="Add guest"
      >
        <form className="space-y-5" onSubmit={submit} ref={formRef}>
        <div className="grid gap-4 sm:grid-cols-[100px_1fr_1fr]">
          <Field defaultValue="" label="Title" name="title" />
          <Field autoFocus defaultValue="" label="First name" name="firstName" required />
          <Field defaultValue="" label="Last name" name="lastName" required />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field defaultValue="" label="Email" name="email" type="email" />
          <Field defaultValue="" label="Phone" name="phone" />
          <SelectField defaultValue="ADULT" label="Age group" name="ageGroup">
            <option value="ADULT">Adult</option>
            <option value="CHILD">Child</option>
            <option value="INFANT">Infant</option>
          </SelectField>
          {lockedHouseholdId ? (
            <div className="grid gap-1.5 text-xs font-medium text-[#6B6B63]">
              Household
              <div className="flex h-10 items-center rounded-[10px] border border-[#E8E8E3] bg-[#FAFAF8] px-3 text-[13px] text-[#1C1C1C]">
                {households.find((household) => household.id === lockedHouseholdId)?.name ?? "Selected household"}
              </div>
            </div>
          ) : (
            <SelectField defaultValue="" label="Household" name="householdId">
              <option value="">No household</option>
              {households.map((household) => <option key={household.id} value={household.id}>{household.name}</option>)}
            </SelectField>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextArea defaultValue="" label="Dietary requirements" name="dietaryRequirements" />
          <TextArea defaultValue="" label="Notes" name="notes" />
        </div>
        <TagFields tags={tags} />

        <div className="rounded-xl border border-dashed border-[#C9DCC5] bg-[#F7FBF5] p-4">
          <button
            className="text-sm font-semibold text-[#2D5A27] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]"
            onClick={togglePlusOne}
            type="button"
          >
            {plusOneOpen ? "− Remove plus-one" : "+ Add a plus-one"}
          </button>
          {plusOneOpen ? (
            <div className="mt-4 space-y-4 border-t border-[#DDEBD9] pt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <ControlledField label="First name" required value={plusOneDraft.firstName} onChange={(value) => setPlusOneDraft((draft) => ({ ...draft, firstName: value }))} />
                <ControlledField label="Last name" required value={plusOneDraft.lastName} onChange={(value) => setPlusOneDraft((draft) => ({ ...draft, lastName: value }))} />
                <ControlledField label="Email" type="email" value={plusOneDraft.email} onChange={(value) => setPlusOneDraft((draft) => ({ ...draft, email: value }))} />
                <ControlledField label="Phone" value={plusOneDraft.phone} onChange={(value) => setPlusOneDraft((draft) => ({ ...draft, phone: value }))} />
                <label className="grid gap-1.5 text-xs font-medium text-[#6B6B63]">
                  Age group
                  <Select value={plusOneDraft.ageGroup} onChange={(event) => setPlusOneDraft((draft) => ({ ...draft, ageGroup: event.target.value }))}>
                    <option value="ADULT">Adult</option>
                    <option value="CHILD">Child</option>
                    <option value="INFANT">Infant</option>
                  </Select>
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <ControlledTextArea label="Dietary requirements" value={plusOneDraft.dietaryRequirements} onChange={(value) => setPlusOneDraft((draft) => ({ ...draft, dietaryRequirements: value }))} />
                <ControlledTextArea label="Notes" value={plusOneDraft.notes} onChange={(value) => setPlusOneDraft((draft) => ({ ...draft, notes: value }))} />
              </div>
            </div>
          ) : null}
        </div>

        {error ? <p className="text-sm text-[#9D3F32]">{error}</p> : null}
        <div className="flex justify-end gap-2 border-t border-[#F0EFEA] pt-4">
          <Button disabled={isPending} onClick={close} type="button" variant="ghost">Cancel</Button>
          <Button disabled={isPending} type="submit" variant="primary">{isPending ? "Adding…" : "Add guest"}</Button>
        </div>
        </form>
      </Modal>
      <ConfirmDialog
        confirmLabel={confirmation === "close" ? "Discard and close" : "Clear and collapse"}
        description={confirmation === "close"
          ? "The entered plus-one details will be discarded."
          : "The entered plus-one details will be cleared."}
        onClose={() => setConfirmation(null)}
        onConfirm={confirmDiscard}
        open={Boolean(confirmation)}
        title={confirmation === "close" ? "Discard plus-one details?" : "Clear plus-one details?"}
      />
    </>
  );
}

function hasPlusOneDraft(draft: PlusOneDraft) {
  return [
    draft.firstName,
    draft.lastName,
    draft.email,
    draft.phone,
    draft.dietaryRequirements,
    draft.notes,
  ].some((value) => value.trim().length > 0);
}

function Field({ label, name, defaultValue, type = "text", required = false, autoFocus = false }: { label: string; name: string; defaultValue: string; type?: string; required?: boolean; autoFocus?: boolean }) {
  return <label className="grid gap-1.5 text-xs font-medium text-[#6B6B63]">{label}<Input autoFocus={autoFocus} data-modal-autofocus={autoFocus ? "true" : undefined} defaultValue={defaultValue} name={name} required={required} type={type} /></label>;
}

function SelectField({ label, name, defaultValue, children }: { label: string; name: string; defaultValue: string; children: ReactNode }) {
  return <label className="grid gap-1.5 text-xs font-medium text-[#6B6B63]">{label}<Select defaultValue={defaultValue} name={name}>{children}</Select></label>;
}

function TextArea({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  return <label className="grid gap-1.5 text-xs font-medium text-[#6B6B63]">{label}<textarea className="min-h-20 rounded-[10px] border border-[#E8E8E3] bg-white px-3 py-2 text-sm outline-none focus:border-[#2D5A27] focus:ring-2 focus:ring-[#EAF0E8]" defaultValue={defaultValue} name={name} /></label>;
}

function ControlledField({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return <label className="grid gap-1.5 text-xs font-medium text-[#6B6B63]">{label}<Input onChange={(event) => onChange(event.target.value)} required={required} type={type} value={value} /></label>;
}

function ControlledTextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="grid gap-1.5 text-xs font-medium text-[#6B6B63]">{label}<textarea className="min-h-20 rounded-[10px] border border-[#E8E8E3] bg-white px-3 py-2 text-sm outline-none focus:border-[#2D5A27] focus:ring-2 focus:ring-[#EAF0E8]" onChange={(event) => onChange(event.target.value)} value={value} /></label>;
}

function TagFields({ tags }: { tags: GuestListTag[] }) {
  return (
    <fieldset>
      <legend className="text-xs font-medium text-[#6B6B63]">Tags</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {tags.length > 0 ? tags.map((tag) => (
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#E8E8E3] px-3 py-1.5 text-xs text-[#6B6B63] has-[:checked]:border-[#2D5A27] has-[:checked]:bg-[#EAF0E8] has-[:checked]:text-[#2D5A27]" key={tag.id}>
            <input className="sr-only" name="tagIds" type="checkbox" value={tag.id} />{tag.name}
          </label>
        )) : <span className="text-xs text-[#8A8A82]">No tags created yet.</span>}
      </div>
    </fieldset>
  );
}
