"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  createWeddingInvitation,
  resendWeddingInvitation,
  revokeWeddingInvitation,
  type WeddingInvitationListItem,
} from "@/src/server/actions/wedding/wedding.actions";

export function InvitationManagement({
  initialInvitations,
}: {
  initialInvitations: WeddingInvitationListItem[];
}) {
  const router = useRouter();
  const [invitations, setInvitations] = useState(initialInvitations);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [developmentUrl, setDevelopmentUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function clearFeedback() {
    setMessage(null);
    setError(null);
    setDevelopmentUrl(null);
  }

  function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();

    startTransition(async () => {
      const result = await createWeddingInvitation({ email });

      if (!result.success) {
        setError(result.error);
        return;
      }

      setEmail("");
      setMessage(result.data.message);
      setDevelopmentUrl(result.data.developmentUrl);
      router.refresh();
    });
  }

  function handleResend(id: string) {
    clearFeedback();

    startTransition(async () => {
      const result = await resendWeddingInvitation(id);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setMessage(result.data.message);
      setDevelopmentUrl(result.data.developmentUrl);
      router.refresh();
    });
  }

  function handleRevoke(id: string) {
    clearFeedback();

    startTransition(async () => {
      const result = await revokeWeddingInvitation(id);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setInvitations((current) =>
        current.map((invitation) =>
          invitation.id === id
            ? { ...invitation, status: "REVOKED", revokedAt: new Date().toISOString() }
            : invitation,
        ),
      );
      setMessage("The invitation was revoked.");
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-[#1C1C1C]">Wedding invitations</h2>
        <p className="mt-1 text-sm leading-6 text-[#7A7A6E]">
          Invite your fiancé(e) or another trusted collaborator. Invitations grant OWNER access and expire after seven days.
        </p>
      </div>

      <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleCreate}>
        <input
          aria-label="Invitation email"
          className="min-w-0 flex-1 rounded-[10px] border border-[#E4E0D4] bg-white px-3.5 py-3 text-sm outline-none transition focus:border-[#2D5A27] focus:ring-2 focus:ring-[#EAF0E8]"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="partner@example.com"
          required
          type="email"
          value={email}
        />
        <button
          className="rounded-[10px] bg-[#2D5A27] px-4 py-3 text-sm font-semibold text-white hover:bg-[#245020] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isPending}
          type="submit"
        >
          {isPending ? "Working…" : "Send invitation"}
        </button>
      </form>

      {error ? <p className="rounded-lg bg-[#FFF5F3] px-3 py-2 text-sm text-[#9D3F32]">{error}</p> : null}
      {message ? (
        <div className="rounded-lg bg-[#EAF0E8] px-3 py-2 text-sm text-[#2D5A27]">
          <p>{message}</p>
          {developmentUrl ? (
            <a className="mt-1 inline-block break-all font-medium underline" href={developmentUrl}>
              Open development invitation link
            </a>
          ) : null}
        </div>
      ) : null}

      {invitations.length === 0 ? (
        <p className="rounded-[10px] border border-dashed border-[#D9D6C9] px-4 py-5 text-sm text-[#7A7A6E]">
          No invitations have been sent for this wedding.
        </p>
      ) : (
        <ul className="divide-y divide-[#EEECE4] rounded-[12px] border border-[#E4E0D4]">
          {invitations.map((invitation) => {
            const canResend = invitation.status !== "ACCEPTED";
            const canRevoke = invitation.status === "PENDING";

            return (
              <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between" key={invitation.id}>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[#1C1C1C]">{invitation.invitedEmail}</p>
                  <p className="mt-1 text-xs text-[#7A7A6E]">
                    {invitation.status} · expires {formatDate(invitation.expiresAt)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {canResend ? (
                    <button className="rounded-lg border border-[#D9D6C9] px-3 py-2 text-xs font-semibold text-[#3F413A] disabled:opacity-50" disabled={isPending} onClick={() => handleResend(invitation.id)} type="button">
                      Resend
                    </button>
                  ) : null}
                  {canRevoke ? (
                    <button className="rounded-lg border border-[#E7C9C5] px-3 py-2 text-xs font-semibold text-[#9D3F32] disabled:opacity-50" disabled={isPending} onClick={() => handleRevoke(invitation.id)} type="button">
                      Revoke
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value));
}
