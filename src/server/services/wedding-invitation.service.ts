import "server-only";

import { randomBytes, createHash } from "node:crypto";

import {
  WeddingInvitationStatus,
  WeddingMemberRole,
} from "../../../app/generated/prisma/client";
import {
  WeddingInvitationEmailError,
  sendWeddingInvitationEmail,
} from "./email/invitation-email.service";
import {
  weddingInvitationRepository,
  WeddingInvitationRepositoryError,
} from "../repositories/wedding-invitation.repository";
import { getAuthenticatedUser } from "../auth/get-authenticated-user";

export const WEDDING_INVITATION_EXPIRY_DAYS = 7;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{32,128}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type PublicWeddingInvitation = {
  state: "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED" | "INVALID";
  invitedEmail: string | null;
  acceptedByEmail: string | null;
  maskedEmail: string | null;
  weddingName: string | null;
  inviterName: string | null;
  expiresAt: Date | null;
};

export class WeddingInvitationServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WeddingInvitationServiceError";
  }
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string) {
  return EMAIL_PATTERN.test(normalizeEmail(value));
}

function hashToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function createRawToken() {
  return randomBytes(32).toString("base64url");
}

function getInvitationUrl(token: string) {
  const configuredAppUrl = process.env.APP_URL?.trim();
  const isProduction = process.env.NODE_ENV === "production";

  if (!configuredAppUrl && isProduction) {
    throw new WeddingInvitationServiceError(
      "APP_URL must be configured before sending invitations in production.",
    );
  }

  const appUrl = configuredAppUrl || "http://localhost:3000";

  try {
    const parsedAppUrl = new URL(appUrl);

    if (
      isProduction &&
      ["localhost", "127.0.0.1", "::1"].includes(parsedAppUrl.hostname)
    ) {
      throw new WeddingInvitationServiceError(
        "APP_URL must point to the deployed application in production.",
      );
    }

    return new URL(
      `/invitations/accept?token=${encodeURIComponent(token)}`,
      parsedAppUrl,
    ).toString();
  } catch (error) {
    if (error instanceof WeddingInvitationServiceError) {
      throw error;
    }

    throw new WeddingInvitationServiceError(
      "APP_URL must be a valid application URL.",
    );
  }
}

function maskEmail(email: string) {
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return "the invited email address";

  const visibleLocalPart = localPart.length <= 2
    ? `${localPart[0] ?? ""}*`
    : `${localPart[0]}${"*".repeat(Math.min(localPart.length - 1, 5))}`;

  return `${visibleLocalPart}@${domain}`;
}

function mapInvitationState(status: WeddingInvitationStatus): PublicWeddingInvitation["state"] {
  return status;
}

export function getInvitationReturnPath(rawToken: string) {
  if (!TOKEN_PATTERN.test(rawToken)) return null;
  return `/invitations/accept?token=${encodeURIComponent(rawToken)}`;
}

export async function getPublicWeddingInvitation(rawToken: string): Promise<PublicWeddingInvitation> {
  if (!TOKEN_PATTERN.test(rawToken)) {
    return {
      state: "INVALID",
      invitedEmail: null,
      acceptedByEmail: null,
      maskedEmail: null,
      weddingName: null,
      inviterName: null,
      expiresAt: null,
    };
  }

  const invitation = await weddingInvitationRepository.findByTokenHash(hashToken(rawToken));

  if (!invitation) {
    return {
      state: "INVALID",
      invitedEmail: null,
      acceptedByEmail: null,
      maskedEmail: null,
      weddingName: null,
      inviterName: null,
      expiresAt: null,
    };
  }

  let status = invitation.status;
  if (status === WeddingInvitationStatus.PENDING && invitation.expiresAt <= new Date()) {
    await weddingInvitationRepository.markExpiredIfPending(invitation.id, new Date());
    status = WeddingInvitationStatus.EXPIRED;
  }

  return {
    state: mapInvitationState(status),
    invitedEmail: status === WeddingInvitationStatus.PENDING ? invitation.invitedEmail : null,
    acceptedByEmail: invitation.acceptedBy?.email ?? null,
    maskedEmail: maskEmail(invitation.invitedEmail),
    weddingName: invitation.wedding.name,
    inviterName: `${invitation.invitedBy.firstName} ${invitation.invitedBy.lastName}`.trim(),
    expiresAt: invitation.expiresAt,
  };
}

export type InvitationDeliveryResult = {
  invitationId: string;
  emailSent: boolean;
  developmentFallback: boolean;
  developmentUrl: string | null;
  message: string;
};

export class WeddingInvitationService {
  async createAndSend(input: {
    weddingId: string;
    weddingName: string;
    invitedEmail: string;
    invitedByUserId: string;
    inviterFirstName: string;
  }): Promise<InvitationDeliveryResult> {
    const invitedEmail = normalizeEmail(input.invitedEmail);

    if (!isValidEmail(invitedEmail)) {
      throw new WeddingInvitationServiceError("Enter a valid invitation email address.");
    }

    const pending = await weddingInvitationRepository.findPendingByWeddingAndEmail(
      input.weddingId,
      invitedEmail,
    );

    if (pending) {
      throw new WeddingInvitationServiceError(
        "A pending invitation already exists for this email address.",
      );
    }

    const rawToken = createRawToken();
    const expiresAt = new Date(
      Date.now() + WEDDING_INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    );
    const invitationUrl = getInvitationUrl(rawToken);
    const invitation = await weddingInvitationRepository.create({
      weddingId: input.weddingId,
      invitedEmail,
      role: WeddingMemberRole.OWNER,
      tokenHash: hashToken(rawToken),
      expiresAt,
      invitedByUserId: input.invitedByUserId,
    });

    try {
      const delivery = await sendWeddingInvitationEmail({
        invitedEmail,
        inviterFirstName: input.inviterFirstName,
        weddingName: input.weddingName,
        invitationUrl,
        expiresAt,
      });

      return {
        invitationId: invitation.id,
        emailSent: delivery.sent,
        developmentFallback: delivery.developmentFallback,
        developmentUrl: delivery.developmentFallback ? invitationUrl : null,
        message: delivery.sent
          ? "The invitation email was sent."
          : "The invitation was created. The development email fallback logged the invitation URL on the server.",
      };
    } catch (error) {
      if (!(error instanceof WeddingInvitationEmailError)) throw error;

      console.error("[wedding-invitation] email delivery failed", error);
      return {
        invitationId: invitation.id,
        emailSent: false,
        developmentFallback: false,
        developmentUrl: null,
        message: "The invitation was created, but the email could not be sent. You can resend it from Settings.",
      };
    }
  }

  async resend(input: {
    id: string;
    weddingId: string;
    weddingName: string;
    invitedByUserId: string;
    inviterFirstName: string;
  }) {
    const existing = await weddingInvitationRepository.findForWedding(input.id, input.weddingId);

    if (!existing) {
      throw new WeddingInvitationServiceError("Invitation not found.");
    }

    if (existing.status === WeddingInvitationStatus.ACCEPTED) {
      throw new WeddingInvitationServiceError("This invitation has already been accepted.");
    }

    if (existing.status === WeddingInvitationStatus.PENDING) {
      await weddingInvitationRepository.revokeForWedding(input.id, input.weddingId);
    }

    return this.createAndSend({
      weddingId: input.weddingId,
      weddingName: input.weddingName,
      invitedEmail: existing.invitedEmail,
      invitedByUserId: input.invitedByUserId,
      inviterFirstName: input.inviterFirstName,
    });
  }

  async revoke(id: string, weddingId: string) {
    const existing = await weddingInvitationRepository.findForWedding(id, weddingId);

    if (!existing) {
      throw new WeddingInvitationServiceError("Invitation not found.");
    }

    if (existing.status !== WeddingInvitationStatus.PENDING) {
      throw new WeddingInvitationServiceError("Only pending invitations can be revoked.");
    }

    await weddingInvitationRepository.revokeForWedding(id, weddingId);
  }

  async list(weddingId: string) {
    return weddingInvitationRepository.listForWedding(weddingId);
  }

  async accept(rawToken: string) {
    if (!TOKEN_PATTERN.test(rawToken)) {
      return { ok: false as const, code: "INVALID" as const };
    }

    const invitation = await weddingInvitationRepository.findByTokenHash(hashToken(rawToken));

    if (!invitation) return { ok: false as const, code: "INVALID" as const };
    if (invitation.status === WeddingInvitationStatus.ACCEPTED) {
      return { ok: false as const, code: "ACCEPTED" as const };
    }
    if (invitation.status === WeddingInvitationStatus.REVOKED) {
      return { ok: false as const, code: "REVOKED" as const };
    }
    if (invitation.status === WeddingInvitationStatus.EXPIRED) {
      return { ok: false as const, code: "EXPIRED" as const };
    }
    if (invitation.expiresAt <= new Date()) {
      await weddingInvitationRepository.markExpiredIfPending(invitation.id, new Date());
      return { ok: false as const, code: "EXPIRED" as const };
    }

    const { user } = await getAuthenticatedUser();
    const expectedEmail = normalizeEmail(invitation.invitedEmail);

    if (normalizeEmail(user.email) !== expectedEmail) {
      return {
        ok: false as const,
        code: "EMAIL_MISMATCH" as const,
        maskedEmail: maskEmail(expectedEmail),
      };
    }

    const acceptance = await weddingInvitationRepository.accept({
      id: invitation.id,
      weddingId: invitation.weddingId,
      userId: user.id,
      role: invitation.role,
    });

    return {
      ok: true as const,
      weddingId: invitation.weddingId,
      alreadyMember: acceptance.alreadyMember,
    };
  }
}

export const weddingInvitationService = new WeddingInvitationService();

export function isInvitationRepositoryError(error: unknown): error is WeddingInvitationRepositoryError {
  return error instanceof WeddingInvitationRepositoryError;
}
