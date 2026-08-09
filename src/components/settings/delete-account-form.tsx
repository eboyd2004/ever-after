"use client";

import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { deleteMyAccount } from "@/src/server/actions/account/account.actions";

export function DeleteAccountForm() {
  const { signOut } = useClerk();
  const router = useRouter();
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const canDelete = confirmation.trim() === "DELETE";

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await deleteMyAccount(confirmation);

      if (!result.success) {
        setError(result.error);
        return;
      }

      // Clerk deletion invalidates the account server-side. Sign out locally
      // as well so the browser cannot retain stale session state.
      try {
        await signOut();
      } catch {
        // The account has already been deleted. Navigation below still clears
        // the current application view if Clerk sign-out cannot complete.
      } finally {
        router.replace("/");
        router.refresh();
      }
    });
  }

  return (
    <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
      <p className="text-sm leading-6 text-[#7A4A43]">
        This permanently deletes your Ever After account, removes your access
        to every wedding, and cannot be undone. Weddings you only belong to
        will remain for their other members. Accounts that own a wedding must
        delete those weddings or arrange ownership transfer first.
      </p>
      <label className="block max-w-xl">
        <span className="mb-1.5 block text-sm font-medium text-[#5C211B]">
          Type <strong>DELETE</strong> to confirm
        </span>
        <input
          className="h-10 w-full rounded-[10px] border border-[#E7C9C5] bg-white px-3 text-sm text-[#1C1C1C] outline-none placeholder:text-[#B88D86] focus:border-[#9D3F32] focus:ring-2 focus:ring-[#FDE5E0]"
          onChange={(event) => setConfirmation(event.target.value)}
          placeholder="DELETE"
          value={confirmation}
        />
      </label>
      {error ? (
        <p aria-live="polite" className="text-sm text-[#9D3F32]">
          {error}
        </p>
      ) : null}
      <button
        className="rounded-[10px] bg-[#9D3F32] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#84352B] disabled:cursor-not-allowed disabled:opacity-45"
        disabled={!canDelete || isPending}
        type="submit"
      >
        {isPending ? "Deleting account…" : "Delete account permanently"}
      </button>
    </form>
  );
}
