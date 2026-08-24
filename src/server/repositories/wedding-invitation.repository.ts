import "server-only";

import {
  MembershipStatus,
  WeddingInvitationStatus,
  WeddingMemberRole,
} from "../../../app/generated/prisma/client";
import { prisma } from "../db/prisma";
import { logger } from "../logging/logger";

export type CreateWeddingInvitationInput = {
  weddingId: string;
  invitedEmail: string;
  role: WeddingMemberRole;
  tokenHash: string;
  expiresAt: Date;
  invitedByUserId: string;
};

export class WeddingInvitationRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WeddingInvitationRepositoryError";
  }
}

export type WeddingInvitationAcceptanceFailureCode =
  | "INVALID"
  | "EMAIL_MISMATCH";

export class WeddingInvitationAcceptanceError extends WeddingInvitationRepositoryError {
  constructor(
    message: string,
    readonly code: WeddingInvitationAcceptanceFailureCode,
  ) {
    super(message);
    this.name = "WeddingInvitationAcceptanceError";
  }
}

const invitationInclude = {
  wedding: true,
  invitedBy: {
    select: { firstName: true, lastName: true, email: true },
  },
  acceptedBy: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
} as const;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export class WeddingInvitationRepository {
  async findByTokenHash(tokenHash: string) {
    try {
      return await prisma.weddingInvitation.findUnique({
        where: { tokenHash },
        include: invitationInclude,
      });
    } catch (error) {
      logger.error("[wedding-invitation-repository] find invitation failed", error);
      throw new WeddingInvitationRepositoryError("Unable to find wedding invitation");
    }
  }

  async findPendingByWeddingAndEmail(weddingId: string, invitedEmail: string) {
    try {
      return await prisma.weddingInvitation.findFirst({
        where: {
          weddingId,
          invitedEmail,
          status: WeddingInvitationStatus.PENDING,
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        include: invitationInclude,
      });
    } catch (error) {
      logger.error("[wedding-invitation-repository] find pending invitation failed", error);
      throw new WeddingInvitationRepositoryError(
        "Unable to check existing wedding invitations",
      );
    }
  }

  async create(input: CreateWeddingInvitationInput) {
    try {
      return await prisma.weddingInvitation.create({
        data: {
          weddingId: input.weddingId,
          invitedEmail: input.invitedEmail,
          role: input.role,
          status: WeddingInvitationStatus.PENDING,
          tokenHash: input.tokenHash,
          expiresAt: input.expiresAt,
          invitedByUserId: input.invitedByUserId,
        },
        include: invitationInclude,
      });
    } catch (error) {
      logger.error("[wedding-invitation-repository] create invitation failed", error);
      throw new WeddingInvitationRepositoryError("Unable to create wedding invitation");
    }
  }

  async findForWedding(id: string, weddingId: string) {
    try {
      return await prisma.weddingInvitation.findFirst({
        where: { id, weddingId },
        include: invitationInclude,
      });
    } catch (error) {
      logger.error("[wedding-invitation-repository] load wedding invitation failed", error);
      throw new WeddingInvitationRepositoryError("Unable to load wedding invitation");
    }
  }

  async listForWedding(weddingId: string) {
    try {
      return await prisma.weddingInvitation.findMany({
        where: { weddingId },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: {
          id: true,
          invitedEmail: true,
          role: true,
          status: true,
          expiresAt: true,
          acceptedAt: true,
          revokedAt: true,
          createdAt: true,
        },
      });
    } catch (error) {
      logger.error("[wedding-invitation-repository] list invitations failed", error);
      throw new WeddingInvitationRepositoryError("Unable to list wedding invitations");
    }
  }

  async markExpiredIfPending(id: string, now: Date) {
    try {
      const result = await prisma.weddingInvitation.updateMany({
        where: {
          id,
          status: WeddingInvitationStatus.PENDING,
          expiresAt: { lte: now },
        },
        data: { status: WeddingInvitationStatus.EXPIRED },
      });

      return result.count > 0;
    } catch (error) {
      logger.error("[wedding-invitation-repository] expire invitation failed", error);
      throw new WeddingInvitationRepositoryError("Unable to update wedding invitation");
    }
  }

  async revokeForWedding(id: string, weddingId: string) {
    try {
      const result = await prisma.weddingInvitation.updateMany({
        where: {
          id,
          weddingId,
          status: WeddingInvitationStatus.PENDING,
        },
        data: {
          status: WeddingInvitationStatus.REVOKED,
          revokedAt: new Date(),
        },
      });

      return result.count > 0;
    } catch (error) {
      logger.error("[wedding-invitation-repository] revoke invitation failed", error);
      throw new WeddingInvitationRepositoryError("Unable to revoke wedding invitation");
    }
  }

  async accept(input: {
    id: string;
    weddingId: string;
    userId: string;
  }) {
    try {
      return await prisma.$transaction(async (tx) => {
        const now = new Date();
        const invitation = await tx.weddingInvitation.findUnique({
          where: { id: input.id },
          select: {
            weddingId: true,
            invitedEmail: true,
            role: true,
            status: true,
            expiresAt: true,
            acceptedByUserId: true,
          },
        });

        if (!invitation || invitation.weddingId !== input.weddingId) {
          throw new WeddingInvitationAcceptanceError(
            "This invitation is no longer valid.",
            "INVALID",
          );
        }

        const user = await tx.user.findUnique({
          where: { id: input.userId },
          select: { email: true },
        });

        if (!user) {
          throw new WeddingInvitationAcceptanceError(
            "This invitation is no longer valid.",
            "INVALID",
          );
        }

        if (invitation.status === WeddingInvitationStatus.ACCEPTED) {
          if (invitation.acceptedByUserId === input.userId) {
            return { alreadyMember: true, alreadyAccepted: true };
          }

          throw new WeddingInvitationAcceptanceError(
            "This invitation is no longer valid.",
            "INVALID",
          );
        }

        if (
          invitation.status !== WeddingInvitationStatus.PENDING ||
          invitation.expiresAt <= now
        ) {
          throw new WeddingInvitationAcceptanceError(
            "This invitation is no longer valid.",
            "INVALID",
          );
        }

        if (
          normalizeEmail(user.email) !== normalizeEmail(invitation.invitedEmail)
        ) {
          throw new WeddingInvitationAcceptanceError(
            "This invitation belongs to a different verified email address.",
            "EMAIL_MISMATCH",
          );
        }

        const invitationClaim = await tx.weddingInvitation.updateMany({
          where: {
            id: input.id,
            weddingId: input.weddingId,
            invitedEmail: invitation.invitedEmail,
            status: WeddingInvitationStatus.PENDING,
            expiresAt: { gt: now },
          },
          data: {
            status: WeddingInvitationStatus.ACCEPTED,
            acceptedByUserId: input.userId,
            acceptedAt: now,
          },
        });

        if (invitationClaim.count !== 1) {
          throw new WeddingInvitationAcceptanceError(
            "This invitation is no longer valid.",
            "INVALID",
          );
        }

        const existingMembership = await tx.weddingMember.findUnique({
          where: {
            weddingId_userId: {
              weddingId: input.weddingId,
              userId: input.userId,
            },
          },
        });

        const alreadyMember =
          existingMembership?.status === MembershipStatus.ACTIVE;

        if (existingMembership && !alreadyMember) {
          await tx.weddingMember.update({
            where: { id: existingMembership.id },
            data: {
              role: invitation.role,
              status: MembershipStatus.ACTIVE,
              joinedAt: now,
              leftAt: null,
            },
          });
        } else {
          await tx.weddingMember.create({
            data: {
              weddingId: input.weddingId,
              userId: input.userId,
              role: invitation.role,
              status: MembershipStatus.ACTIVE,
              joinedAt: now,
            },
          });
        }

        await tx.userPreference.upsert({
          where: { userId: input.userId },
          create: {
            userId: input.userId,
            activeWeddingId: input.weddingId,
            theme: "light",
            emailNotificationsEnabled: true,
            taskNotificationsEnabled: true,
            paymentNotificationsEnabled: true,
          },
          update: { activeWeddingId: input.weddingId },
        });

        return { alreadyMember, alreadyAccepted: false };
      });
    } catch (error) {
      if (error instanceof WeddingInvitationAcceptanceError) {
        throw error;
      }

      logger.error("[wedding-invitation-repository] accept invitation failed", error);
      throw new WeddingInvitationRepositoryError("Unable to accept wedding invitation");
    }
  }
}

export const weddingInvitationRepository = new WeddingInvitationRepository();
