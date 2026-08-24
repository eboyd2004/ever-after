"use client";

import { Show } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import {
  AppShell,
  type AppShellContext,
} from "@/src/components/shared/app-shell";

export function AuthBoundary({
  children,
  context,
}: {
  children: ReactNode;
  context: AppShellContext | null;
}) {
  const pathname = usePathname();
  const isOnboarding =
    pathname === "/onboarding" || pathname.startsWith("/onboarding/");

  return (
    <>
      <Show when="signed-in">
        {isOnboarding ? children : <AppShell context={context}>{children}</AppShell>}
      </Show>
      <Show when="signed-out">{children}</Show>
    </>
  );
}
