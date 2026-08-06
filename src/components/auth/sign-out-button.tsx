"use client";

import { SignOutButton } from "@clerk/nextjs";

export function SignOutControl() {
  return (
    <SignOutButton>
      <button
        className="inline-flex items-center justify-center rounded-[10px] border border-[#E4E0D4] bg-white px-4 py-2 text-sm font-medium text-[#5C211B] transition hover:border-[#C9A7A0] hover:bg-[#FFF5F3]"
        type="button"
      >
        Sign out
      </button>
    </SignOutButton>
  );
}

