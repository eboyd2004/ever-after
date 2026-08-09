import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  clerkUserDelete: vi.fn(),
  clerkClient: vi.fn(),
  prisma: {
    $transaction: vi.fn(),
  },
  tx: {
    user: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    weddingMember: {
      findFirst: vi.fn(),
      deleteMany: vi.fn(),
    },
    weddingInvitation: {
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock("server-only", () => ({}));
vi.mock("@clerk/nextjs/server", () => ({
  clerkClient: mocks.clerkClient,
}));
vi.mock("../src/server/db/prisma", () => ({ prisma: mocks.prisma }));
vi.mock("../src/server/logging/logger", () => ({
  logger: { error: vi.fn() },
}));

import {
  accountDeletionService,
  AccountDeletionServiceError,
} from "../src/server/services/account-deletion.service";

describe("accountDeletionService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.prisma.$transaction.mockImplementation(async (callback) =>
      callback(mocks.tx),
    );
    mocks.tx.user.findUnique.mockResolvedValue({ authProviderId: "clerk_1" });
    mocks.tx.weddingMember.findFirst.mockResolvedValue(null);
    mocks.tx.weddingInvitation.deleteMany.mockResolvedValue({ count: 2 });
    mocks.tx.weddingMember.deleteMany.mockResolvedValue({ count: 1 });
    mocks.tx.user.delete.mockResolvedValue({ id: "user_1" });
    mocks.clerkUserDelete.mockResolvedValue({ id: "clerk_1", object: "user" });
    mocks.clerkClient.mockResolvedValue({
      users: { deleteUser: mocks.clerkUserDelete },
    });
  });

  it("deletes memberships, sent invitations, the application user, and Clerk user in one transaction", async () => {
    const order: string[] = [];
    mocks.tx.user.findUnique.mockImplementation(async () => {
      order.push("verify");
      return { authProviderId: "clerk_1" };
    });
    mocks.tx.weddingMember.findFirst.mockImplementation(async () => {
      order.push("ownership");
      return null;
    });
    mocks.tx.weddingInvitation.deleteMany.mockImplementation(async () => {
      order.push("invitations");
      return { count: 2 };
    });
    mocks.tx.weddingMember.deleteMany.mockImplementation(async () => {
      order.push("memberships");
      return { count: 1 };
    });
    mocks.tx.user.delete.mockImplementation(async () => {
      order.push("applicationUser");
      return { id: "user_1" };
    });
    mocks.clerkUserDelete.mockImplementation(async () => {
      order.push("clerk");
      return { id: "clerk_1", object: "user" };
    });

    await accountDeletionService.deleteAccount({
      userId: "user_1",
      clerkUserId: "clerk_1",
    });

    expect(order).toEqual([
      "verify",
      "ownership",
      "invitations",
      "memberships",
      "applicationUser",
      "clerk",
    ]);
    expect(mocks.prisma.$transaction).toHaveBeenCalledOnce();
    expect(mocks.tx.weddingInvitation.deleteMany).toHaveBeenCalledWith({
      where: { invitedByUserId: "user_1" },
    });
    expect(mocks.tx.weddingMember.deleteMany).toHaveBeenCalledWith({
      where: { userId: "user_1" },
    });
    expect(mocks.tx.user.delete).toHaveBeenCalledWith({
      where: { id: "user_1" },
    });
    expect(mocks.clerkUserDelete).toHaveBeenCalledWith("clerk_1");
  });

  it("blocks deletion when the user owns an active wedding", async () => {
    mocks.tx.weddingMember.findFirst.mockResolvedValue({ id: "owner_membership" });

    await expect(
      accountDeletionService.deleteAccount({
        userId: "user_1",
        clerkUserId: "clerk_1",
      }),
    ).rejects.toThrow(
      "You cannot delete your account while you own a wedding.",
    );

    expect(mocks.tx.weddingInvitation.deleteMany).not.toHaveBeenCalled();
    expect(mocks.tx.weddingMember.deleteMany).not.toHaveBeenCalled();
    expect(mocks.tx.user.delete).not.toHaveBeenCalled();
    expect(mocks.clerkUserDelete).not.toHaveBeenCalled();
  });

  it("rejects a mismatched local Clerk identity", async () => {
    mocks.tx.user.findUnique.mockResolvedValue({ authProviderId: "another_clerk_user" });

    await expect(
      accountDeletionService.deleteAccount({
        userId: "user_1",
        clerkUserId: "clerk_1",
      }),
    ).rejects.toThrow(AccountDeletionServiceError);

    expect(mocks.tx.user.delete).not.toHaveBeenCalled();
    expect(mocks.clerkUserDelete).not.toHaveBeenCalled();
  });

  it("rolls back the application transaction when Clerk deletion fails", async () => {
    let transactionRejected = false;
    mocks.prisma.$transaction.mockImplementation(async (callback) => {
      try {
        return await callback(mocks.tx);
      } catch (error) {
        transactionRejected = true;
        throw error;
      }
    });
    mocks.clerkUserDelete.mockRejectedValue(new Error("Clerk unavailable"));

    await expect(
      accountDeletionService.deleteAccount({
        userId: "user_1",
        clerkUserId: "clerk_1",
      }),
    ).rejects.toThrow(
      "Unable to delete your authentication account. No application data was deleted.",
    );

    expect(transactionRejected).toBe(true);
    expect(mocks.tx.user.delete).toHaveBeenCalledOnce();
  });
});
