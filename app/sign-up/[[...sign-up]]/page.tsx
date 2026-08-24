import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import {
  getSafeInvitationEmail,
  getSafeInvitationReturnPath,
} from "@/src/server/auth/safe-invitation-return";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const redirectValue = Array.isArray(params.redirect_url)
    ? params.redirect_url[0]
    : params.redirect_url;
  const emailValue = Array.isArray(params.email) ? params.email[0] : params.email;
  const invitationRedirect = getSafeInvitationReturnPath(redirectValue);
  const invitationEmail = getSafeInvitationEmail(emailValue);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FAFAF8] px-4 py-12">
      <div className="w-full max-w-[430px]">
        <div className="mb-8 text-center">
          <Link
            className="font-serif text-[28px] leading-none text-[#1C1C1C]"
            href="/"
          >
            Tied Forever
          </Link>
          <p className="mt-2 text-[11px] font-medium tracking-[0.14em] text-[#7A7A6E]">
            WEDDING PLANNER
          </p>
        </div>
        <SignUp
          // First/last name fields and email verification are enabled in the
          // Clerk instance settings; Clerk owns the credential flow.
          fallbackRedirectUrl={invitationRedirect ?? "/dashboard"}
          forceRedirectUrl={invitationRedirect ?? undefined}
          initialValues={
            invitationEmail ? { emailAddress: invitationEmail } : undefined
          }
          path="/sign-up"
          routing="path"
          signInUrl="/sign-in"
        />
      </div>
    </main>
  );
}
