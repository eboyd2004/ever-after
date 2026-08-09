import "server-only";

import { clerkClient } from "@clerk/nextjs/server";
import {
  MembershipStatus,
  WeddingMemberRole,
} from "../../../app/generated/prisma/client";
import { prisma } from "../db/prisma";
import { logger } from "../logging/logger";

export type DeleteAccountInput = {
  userId: string;
  clerkUserId: string;
};

export class AccountDeletionServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AccountDeletionServiceError";
  }
}

export class AccountDeletionService {
  async deleteAccount({ userId, clerkUserId }: DeleteAccountInput) {
    try {
      return await prisma.$transaction(async (tx) => {
        const applicationUser = await tx.user.findUnique({
          where: { id: userId },
          select: { authProviderId: true },
        });

        if (!applicationUser || applicationUser.authProviderId !== clerkUserId) {
          throw new AccountDeletionServiceError(
            "Your account could not be verified for deletion.",
          );
        }

        const ownedWedding = await tx.weddingMember.findFirst({
          where: {
            userId,
            role: WeddingMemberRole.OWNER,
            status: MembershipStatus.ACTIVE,
          },
          select: { id: true },
        });

        if (ownedWedding) {
          // Ownership transfer is deliberately not implicit. Deleting an owner
          // could leave a wedding without an active owner, so the account must
          // be blocked until the user deletes those weddings or completes an
          // explicit ownership-transfer workflow in a future feature.
          throw new AccountDeletionServiceError(
            "You cannot delete your account while you own a wedding. Delete those weddings or arrange ownership transfer first.",
          );
        }

        // Invitations created by this user have a Restrict foreign key. They
        // are removed so deleting the account cannot leave invalid inviter
        // references. Accepted memberships remain independent records.
        await tx.weddingInvitation.deleteMany({
          where: { invitedByUserId: userId },
        });

        // Removing memberships leaves the weddings and their other members
        // intact. Task.assigneeId uses SetNull, so assigned tasks remain valid
        // without retaining a deleted member record.
        await tx.weddingMember.deleteMany({ where: { userId } });

        // UserPreference cascades, and accepted invitation references use
        // SetNull, as defined in the Prisma schema.
        await tx.user.delete({ where: { id: userId } });

        try {
          const client = await clerkClient();
          await client.users.deleteUser(clerkUserId);
        } catch (error) {
          // The transaction is still uncommitted here. Throwing causes the
          // staged application deletion to roll back when Clerk rejects the
          // deletion, leaving the account retryable and intact locally.
          logger.error(
            "[account-deletion] Clerk user deletion failed",
            error,
          );
          throw new AccountDeletionServiceError(
            "Unable to delete your authentication account. No application data was deleted.",
          );
        }

        return null;
      });
    } catch (error) {
      if (error instanceof AccountDeletionServiceError) throw error;

      logger.error("[account-deletion] account deletion failed", error);
      throw new AccountDeletionServiceError(
        "Unable to delete your account. Please try again.",
      );
    }
  }
}

export const accountDeletionService = new AccountDeletionService();
