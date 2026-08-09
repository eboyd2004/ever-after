import "server-only";

export type WeddingInvitationEmailInput = {
  invitedEmail: string;
  inviterFirstName: string;
  weddingName: string;
  invitationUrl: string;
  expiresAt: Date;
};

export type WeddingInvitationEmailResult = {
  sent: boolean;
  developmentFallback: boolean;
};

export class WeddingInvitationEmailError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WeddingInvitationEmailError";
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatExpiry(expiresAt: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(expiresAt);
}

export function renderWeddingInvitationEmail(input: WeddingInvitationEmailInput) {
  const inviter = escapeHtml(input.inviterFirstName);
  const weddingName = escapeHtml(input.weddingName);
  const invitationUrl = escapeHtml(input.invitationUrl);
  const expiry = escapeHtml(formatExpiry(input.expiresAt));

  return {
    subject: `${input.inviterFirstName} invited you to Tied Forever`,
    html: `<p>${inviter} invited you to join <strong>${weddingName}</strong> on Tied Forever.</p>
<p>Use the button below to join the private wedding planning workspace. This invitation expires on ${expiry}.</p>
<p><a href="${invitationUrl}">Join wedding</a></p>
<p>If the button does not work, copy and paste this URL:</p>
<p>${invitationUrl}</p>
<p>This invitation should only be used by the invited email address.</p>`,
    text: `${input.inviterFirstName} invited you to join ${input.weddingName} on Tied Forever.

Join wedding: ${input.invitationUrl}

This invitation expires on ${formatExpiry(input.expiresAt)} and should only be used by the invited email address.`,
  };
}

/**
 * Provider-independent email boundary. A real provider can be added here
 * without changing invitation persistence or acceptance logic.
 */
export async function sendWeddingInvitationEmail(
  input: WeddingInvitationEmailInput,
): Promise<WeddingInvitationEmailResult> {
  const provider = process.env.EMAIL_PROVIDER?.trim().toLowerCase() || "development";
  const template = renderWeddingInvitationEmail(input);

  if (provider === "development") {
    if (process.env.NODE_ENV === "production") {
      throw new WeddingInvitationEmailError(
        "A production email provider must be configured before sending invitations.",
      );
    }

    console.info(
      "[wedding-invitation] Development email fallback; subject:",
      template.subject,
      "invitation URL:",
      input.invitationUrl,
    );
    return { sent: false, developmentFallback: true };
  }

  throw new WeddingInvitationEmailError(
    `Email provider \"${provider}\" is configured but has no transport implementation.`,
  );
}
