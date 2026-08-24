import "server-only";

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{32,128}$/;

export function getSafeInvitationReturnPath(value: unknown) {
  if (typeof value !== "string" || value.length > 500) return null;

  try {
    const url = new URL(value, "https://ever-after.invalid");
    const token = url.searchParams.get("token");

    if (
      url.origin !== "https://ever-after.invalid" ||
      url.pathname !== "/invitations/accept" ||
      !token ||
      !TOKEN_PATTERN.test(token)
    ) {
      return null;
    }

    return `/invitations/accept?token=${encodeURIComponent(token)}`;
  } catch {
    return null;
  }
}

export function getSafeInvitationEmail(value: unknown) {
  if (typeof value !== "string" || value.length > 254) return undefined;

  const email = value.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : undefined;
}
