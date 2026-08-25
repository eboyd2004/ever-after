import { clerkMiddleware } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";

const protectedRoutes = [
  "/onboarding",
  "/dashboard",
  "/checklist",
  "/guests",
  "/invitations",
  "/rsvps",
  "/seating",
  "/suppliers",
  "/budget",
  "/timeline",
  "/registry",
  "/documents",
  "/notes",
  "/settings",
] as const;

function isProtectedPath(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Workspace invitation acceptance is public; the token and verified Clerk email are
  // validated by the acceptance service before any membership is created.
  if (pathname === "/invitations/accept") return false;

  return protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export default clerkMiddleware(async (auth, request) => {
  if (isProtectedPath(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Run Clerk on application requests while leaving static assets alone.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
