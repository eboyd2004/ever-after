import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

import { AuthBoundary } from "@/src/components/auth/auth-boundary";
import { type AppShellContext } from "@/src/components/shared/app-shell";
import {
  AuthenticationRequiredError,
  getAuthenticatedUser,
} from "@/src/server/auth/get-authenticated-user";
import { getActiveWedding } from "@/src/server/auth/get-active-wedding";
import { logger } from "@/src/server/logging/logger";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ever After Wedding Planner",
  description: "Plan every detail of your wedding in one place.",
};

export const dynamic = "force-dynamic";

function formatWeddingDate(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "long",
    timeZone: timezone,
  }).format(date);
}

function formatCountdown(date: Date) {
  const days = Math.ceil((date.getTime() - Date.now()) / 86_400_000);

  if (days > 0) return `${days} days to go`;
  if (days === 0) return "Wedding day";
  return "Wedding date passed";
}

async function getShellContext(): Promise<AppShellContext | null> {
  let authenticatedUser;

  try {
    authenticatedUser = await getAuthenticatedUser();
  } catch (error) {
    if (!(error instanceof AuthenticationRequiredError)) {
      logger.error("[layout] authenticated user load failed", error);
    }

    return null;
  }

  let activeWeddingContext: Awaited<ReturnType<typeof getActiveWedding>> = null;

  try {
    activeWeddingContext = await getActiveWedding({
      redirectToOnboarding: false,
    });
  } catch (error) {
    logger.error("[layout] active wedding context load failed", error);
  }

  let wedding: AppShellContext["wedding"] = null;

  if (activeWeddingContext) {
    wedding = {
      id: activeWeddingContext.wedding.id,
      weddingName: activeWeddingContext.wedding.name,
      partnerNames: `${activeWeddingContext.wedding.partnerOneName} & ${activeWeddingContext.wedding.partnerTwoName}`,
      weddingDate: formatWeddingDate(
        activeWeddingContext.wedding.weddingDate,
        activeWeddingContext.wedding.timezone,
      ),
      countdown: formatCountdown(activeWeddingContext.wedding.weddingDate),
    };
  }

  const { user } = activeWeddingContext ?? authenticatedUser;
  const fallbackName = user.email;

  return {
    wedding,
    availableWeddings: activeWeddingContext?.availableWeddings.map((availableWedding) => ({
      id: availableWedding.id,
      name: availableWedding.name,
      partnerNames: `${availableWedding.partnerOneName} & ${availableWedding.partnerTwoName}`,
    })) ?? [],
    user: {
      userName:
        [user.firstName, user.lastName].filter(Boolean).join(" ") || fallbackName,
      userEmail: user.email,
      userInitials:
        `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase() || "EA",
      profileImageUrl: user.profileImageUrl,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const context = await getShellContext();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider>
          <AuthBoundary context={context}>{children}</AuthBoundary>
        </ClerkProvider>
      </body>
    </html>
  );
}
