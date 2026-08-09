import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAuthenticatedUser: vi.fn(),
  deleteAccount: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));
vi.mock("../src/server/auth/get-authenticated-user", () => ({
  AuthenticationRequiredError: class AuthenticationRequiredError extends Error {},
  getAuthenticatedUser: mocks.getAuthenticatedUser,
}));
vi.mock("../src/server/services/account-deletion.service", () => ({
  AccountDeletionServiceError: class AccountDeletionServiceError extends Error {},
  accountDeletionService: { deleteAccount: mocks.deleteAccount },
}));
vi.mock("../src/server/logging/logger", () => ({
  logger: { error: vi.fn() },
}));

import { deleteMyAccount } from "../src/server/actions/account/account.actions";

describe("deleteMyAccount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAuthenticatedUser.mockResolvedValue({
      clerkUserId: "clerk_1",
      user: { id: "user_1" },
    });
    mocks.deleteAccount.mockResolvedValue(null);
  });

  it("requires the exact confirmation phrase before doing anything", async () => {
    await expect(deleteMyAccount("delete")).resolves.toEqual({
      success: false,
      error: "Type DELETE to confirm account deletion.",
    });

    expect(mocks.getAuthenticatedUser).not.toHaveBeenCalled();
    expect(mocks.deleteAccount).not.toHaveBeenCalled();
  });

  it("deletes only the authenticated application user", async () => {
    await expect(deleteMyAccount(" DELETE ")).resolves.toEqual({
      success: true,
      data: null,
    });

    expect(mocks.deleteAccount).toHaveBeenCalledWith({
      userId: "user_1",
      clerkUserId: "clerk_1",
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/", "layout");
  });
});
