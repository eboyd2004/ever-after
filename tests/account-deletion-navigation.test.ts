import { describe, expect, it, vi } from "vitest";

import { navigateAfterAccountDeletion } from "../src/components/settings/account-deletion-navigation";

describe("navigateAfterAccountDeletion", () => {
  it("delegates public-home navigation to Clerk sign-out", async () => {
    const signOut = vi.fn().mockResolvedValue(undefined);
    const fallbackRedirect = vi.fn();

    await navigateAfterAccountDeletion(signOut, fallbackRedirect);

    expect(signOut).toHaveBeenCalledWith({ redirectUrl: "/" });
    expect(fallbackRedirect).not.toHaveBeenCalled();
  });

  it("falls back to a full public-home navigation when the deleted session cannot sign out", async () => {
    const signOut = vi.fn().mockRejectedValue(new Error("session deleted"));
    const fallbackRedirect = vi.fn();

    await navigateAfterAccountDeletion(signOut, fallbackRedirect);

    expect(fallbackRedirect).toHaveBeenCalledOnce();
  });
});
