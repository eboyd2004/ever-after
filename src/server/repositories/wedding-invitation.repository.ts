import {
  MembershipStatus,
  WeddingInvitationStatus,
  WeddingMemberRole,
} from "../../../app/generated/prisma/client";
import { prisma } from "../db/prisma";

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

const invitationInclude = {
  wedding: true,
  invitedBy: {
    select: { firstName: true, lastName: true, email: true },
  },
  acceptedBy: {
    select: { firstName: true, lastName: true, email: true },
  },
} as const;

export class WeddingInvitationRepository {
  async findByTokenHash(tokenHash: string) {
    try {
      return await prisma.weddingInvitation.findUnique({
        where: { tokenHash },
        include: invitationInclude,
      });
    } catch (error) {
      console.error("[wedding-invitation-repository] find invitation failed", error);
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
      console.error("[wedding-invitation-repository] find pending invitation failed", error);
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
      console.error("[wedding-invitation-repository] create invitation failed", error);
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
      console.error("[wedding-invitation-repository] load wedding invitation failed", error);
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
      console.error("[wedding-invitation-repository] list invitations failed", error);
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
      console.error("[wedding-invitation-repository] expire invitation failed", error);
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
      console.error("[wedding-invitation-repository] revoke invitation failed", error);
      throw new WeddingInvitationRepositoryError("Unable to revoke wedding invitation");
    }
  }

  async accept(input: {
    id: string;
    weddingId: string;
    userId: string;
    role: WeddingMemberRole;
  }) {
    const now = new Date();

    try {
      const existingMembership = await prisma.weddingMember.findUnique({
        where: {
          weddingId_userId: {
            weddingId: input.weddingId,
            userId: input.userId,
          },
        },
      });

      const invitationUpdate = prisma.weddingInvitation.updateMany({
        where: {
          id: input.id,
          weddingId: input.weddingId,
          status: WeddingInvitationStatus.PENDING,
          expiresAt: { gt: now },
        },
        data: {
          status: WeddingInvitationStatus.ACCEPTED,
          acceptedByUserId: input.userId,
          acceptedAt: now,
        },
      });

      const preferenceUpdate = prisma.userPreference.upsert({
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

      if (existingMembership?.status === MembershipStatus.ACTIVE) {
        await prisma.$transaction([invitationUpdate, preferenceUpdate]);
        return { alreadyMember: true };
      }

      const membershipWrite = existingMembership
        ? prisma.weddingMember.update({
            where: { id: existingMembership.id },
            data: {
              role: input.role,
              status: MembershipStatus.ACTIVE,
              joinedAt: now,
              leftAt: null,
            },
          })
        : prisma.weddingMember.create({
            data: {
              weddingId: input.weddingId,
              userId: input.userId,
              role: input.role,
              status: MembershipStatus.ACTIVE,
              joinedAt: now,
            },
          });

      await prisma.$transaction([
        membershipWrite,
        invitationUpdate,
        preferenceUpdate,
      ]);

      return { alreadyMember: false };
    } catch (error) {
      console.error("[wedding-invitation-repository] accept invitation failed", error);
      throw new WeddingInvitationRepositoryError("Unable to accept wedding invitation");
    }
  }
}

export const weddingInvitationRepository = new WeddingInvitationRepository();
