"use client";

import { useEffect } from "react";

import { Button, Card } from "@/src/components/shared/ui";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      console.error("[app] uncaught route error", error.digest);
    } else {
      console.error("[app] uncaught route error", error);
    }
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FAFAF8] px-5 py-12">
      <Card className="w-full max-w-xl border-[#E7C9C5] bg-[#FFF8F6] p-6 text-[#5C211B] sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9D3F32]">
          Something went wrong
        </p>
        <h1 className="mt-2 text-2xl font-semibold">Tied Forever could not load this page</h1>
        <p className="mt-3 text-sm leading-6 text-[#7A4A43]">
          Try again, or return to the dashboard if the problem continues.
        </p>
        <Button className="mt-6" onClick={reset} variant="primary">
          Try again
        </Button>
      </Card>
    </main>
  );
}
