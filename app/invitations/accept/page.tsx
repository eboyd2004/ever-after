import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { SignOutControl } from "@/src/components/auth/sign-out-button";
import {
  AuthenticationRequiredError,
  getAuthenticatedUser,
} from "@/src/server/auth/get-authenticated-user";
import {
  getInvitationReturnPath,
  getPublicWeddingInvitation,
  normalizeEmail,
  weddingInvitationService,
} from "@/src/server/services/wedding-invitation.service";

export const dynamic = "force-dynamic";

export default async function InvitationAcceptancePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const tokenValue = Array.isArray(params.token) ? params.token[0] : params.token;
  const token = typeof tokenValue === "string" ? tokenValue : null;

  if (!token) return <InvitationState title="Invitation link is invalid" message="This invitation link is missing its secure token." />;

  let invitation;
  try {
    invitation = await getPublicWeddingInvitation(token);
  } catch (error) {
    console.error("[wedding-invitation] load public invitation failed", error);
    return <InvitationState title="Invitation unavailable" message="We could not load this invitation right now. Please ask the wedding owner to send it again." />;
  }

  if (invitation.state === "ACCEPTED" && invitation.acceptedByEmail) {
    try {
      const { user } = await getAuthenticatedUser();
      if (normalizeEmail(user.email) === normalizeEmail(invitation.acceptedByEmail)) {
        redirect("/dashboard?invitation=already-complete");
      }
    } catch (error) {
      if (!(error instanceof AuthenticationRequiredError)) {
        console.error("[wedding-invitation] accepted invitation identity check failed", error);
      }
    }
  }

  if (invitation.state !== "PENDING") {
    return <InvitationState {...getStateCopy(invitation.state)} />;
  }

  let authenticated = false;
  try {
    await getAuthenticatedUser();
    authenticated = true;
  } catch (error) {
    if (!(error instanceof AuthenticationRequiredError)) {
      console.error("[wedding-invitation] authenticated invitation check failed", error);
      return <InvitationState title="Account verification required" message="Finish verifying your Ever After account before accepting this invitation." />;
    }
  }

  const returnPath = getInvitationReturnPath(token);
  if (!returnPath) {
    return <InvitationState title="Invitation link is invalid" message="This invitation link is not valid." />;
  }

  if (!authenticated) {
    const query = `redirect_url=${encodeURIComponent(returnPath)}&email=${encodeURIComponent(invitation.invitedEmail ?? "")}`;

    return (
      <InvitationLayout>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2D5A27]">
          You&apos;re invited
        </p>
        <h1 className="mt-2 font-serif text-3xl tracking-[-0.03em] text-[#1C1C1C]">
          Join {invitation.weddingName}
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#7A7A6E]">
          {invitation.inviterName} invited you to join their private Ever After wedding workspace as an owner.
        </p>
        <p className="mt-4 rounded-lg bg-[#FBF5E6] px-3 py-2 text-sm text-[#6B5630]">
          This invitation was issued to <strong>{invitation.invitedEmail}</strong> and expires on {formatDate(invitation.expiresAt)}.
        </p>
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <Link className="rounded-[10px] bg-[#2D5A27] px-4 py-3 text-center text-sm font-semibold text-white hover:bg-[#245020]" href={`/sign-up?${query}`}>
            Create account
          </Link>
          <Link className="rounded-[10px] border border-[#D9D6C9] bg-white px-4 py-3 text-center text-sm font-semibold text-[#3F413A] hover:bg-[#FAFAF8]" href={`/sign-in?${query}`}>
            Sign in
          </Link>
        </div>
      </InvitationLayout>
    );
  }

  let result;
  try {
    result = await weddingInvitationService.accept(token);
  } catch (error) {
    console.error("[wedding-invitation] accept invitation failed", error);
    return <InvitationState title="Invitation could not be accepted" message="Please try again or ask the wedding owner to resend the invitation." />;
  }

  if (result.ok) {
    redirect(`/dashboard?invitation=${result.alreadyMember ? "already-complete" : "accepted"}`);
  }

  if (result.code === "EMAIL_MISMATCH") {
    return (
      <InvitationLayout>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9D3F32]">
          Different account
        </p>
        <h1 className="mt-2 font-serif text-3xl tracking-[-0.03em] text-[#1C1C1C]">
          This invitation belongs to another email
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#7A7A6E]">
          Sign in with the verified email address that received this invitation: {result.maskedEmail}.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <SignOutControl />
          <Link className="rounded-[10px] border border-[#D9D6C9] bg-white px-4 py-2.5 text-sm font-semibold text-[#3F413A]" href="/dashboard">
            Return to dashboard
          </Link>
        </div>
      </InvitationLayout>
    );
  }

  return <InvitationState {...getStateCopy(result.code)} />;
}

function InvitationLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FAFAF8] px-5 py-12">
      <section className="w-full max-w-xl rounded-[20px] border border-[#E4E0D4] bg-white p-7 shadow-[0_4px_16px_rgba(0,0,0,0.06)] sm:p-10">
        <Link className="font-serif text-[28px] leading-none text-[#1C1C1C]" href="/">
          Ever After
        </Link>
        {children}
      </section>
    </main>
  );
}

function InvitationState({ title, message }: { title: string; message: string }) {
  return (
    <InvitationLayout>
      <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9D3F32]">
        Wedding invitation
      </p>
      <h1 className="mt-2 font-serif text-3xl tracking-[-0.03em] text-[#1C1C1C]">{title}</h1>
      <p className="mt-3 text-sm leading-6 text-[#7A7A6E]">{message}</p>
      <Link className="mt-7 inline-flex rounded-[10px] bg-[#2D5A27] px-4 py-2.5 text-sm font-semibold text-white" href="/">
        Return to Ever After
      </Link>
    </InvitationLayout>
  );
}

function getStateCopy(state: string) {
  switch (state) {
    case "ACCEPTED":
      return { title: "Invitation already used", message: "This invitation has already been accepted." };
    case "EXPIRED":
      return { title: "Invitation expired", message: "Ask the wedding owner to send a new invitation." };
    case "REVOKED":
      return { title: "Invitation revoked", message: "This invitation is no longer active. Ask the wedding owner to send a new one." };
    default:
      return { title: "Invitation link is invalid", message: "This invitation link is not valid." };
  }
}

function formatDate(value: Date | null) {
  if (!value) return "soon";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeZone: "UTC" }).format(value);
}
