import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";

import type { User } from "../../../app/generated/prisma/client";
import { prisma } from "../db/prisma";

export class AuthenticationRequiredError extends Error {
  constructor() {
    super("Authentication is required.");
    this.name = "AuthenticationRequiredError";
  }
}

export type AuthenticatedUser = {
  clerkUserId: string;
  user: User;
};

/**
 * Resolve the current Clerk session and synchronise its safe profile fields
 * into the application User record. Production user update/deletion syncing
 * should eventually move to verified Clerk webhooks.
 */
export async function getAuthenticatedUser(): Promise<AuthenticatedUser> {
  const { userId } = await auth();

  if (!userId) {
    throw new AuthenticationRequiredError();
  }

  const clerkUser = await currentUser();

  if (!clerkUser || clerkUser.id !== userId) {
    throw new AuthenticationRequiredError();
  }

  const primaryEmailAddress = clerkUser.primaryEmailAddress;
  const email = primaryEmailAddress?.emailAddress?.trim().toLowerCase();

  if (!email) {
    throw new Error(
      "The authenticated Clerk user does not have a usable primary email address.",
    );
  }

  if (primaryEmailAddress?.verification?.status !== "verified") {
    throw new Error(
      "The authenticated Clerk user must have a verified primary email address.",
    );
  }

  const firstName = clerkUser.firstName?.trim();
  const lastName = clerkUser.lastName?.trim();

  if (!firstName || !lastName) {
    throw new Error(
      "The authenticated Clerk user must have a first name and last name.",
    );
  }

  const existingEmailOwner = await prisma.user.findUnique({
    where: { email },
    select: { authProviderId: true },
  });

  if (
    existingEmailOwner &&
    existingEmailOwner.authProviderId !== clerkUser.id
  ) {
    throw new Error(
      "The authenticated email address is already linked to another application user.",
    );
  }

  const user = await prisma.user.upsert({
    where: { authProviderId: clerkUser.id },
    create: {
      authProviderId: clerkUser.id,
      email,
      firstName,
      lastName,
      profileImageUrl: clerkUser.imageUrl ?? null,
    },
    update: {
      email,
      firstName,
      lastName,
      profileImageUrl: clerkUser.imageUrl ?? null,
    },
  });

  return { clerkUserId: clerkUser.id, user };
}
