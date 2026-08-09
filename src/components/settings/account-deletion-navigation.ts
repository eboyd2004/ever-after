type SignOut = (options: { redirectUrl: string }) => Promise<void>;

/**
 * Clerk owns the sign-out navigation. The fallback is only needed when the
 * backend deletion has already invalidated the current session before Clerk
 * can complete its client-side sign-out request.
 */
export async function navigateAfterAccountDeletion(
  signOut: SignOut,
  fallbackRedirect: () => void,
) {
  try {
    await signOut({ redirectUrl: "/" });
  } catch {
    fallbackRedirect();
  }
}
