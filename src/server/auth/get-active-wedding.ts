import "server-only";

import { redirect } from "next/navigation";

import {
  MembershipStatus,
  type User,
  type Wedding,
  type WeddingMember,
  type WeddingMemberRole,
} from "../../../app/generated/prisma/client";
import { prisma } from "../db/prisma";
import {
  AuthenticationRequiredError,
  getAuthenticatedUser,
} from "./get-authenticated-user";
import { weddingRepository } from "../repositories/wedding.repository";

export type AvailableWedding = {
  id: string;
  name: string;
  partnerOneName: string;
  partnerTwoName: string;
  weddingDate: Date;
  timezone: string;
};

export type ActiveWeddingContext = {
  user: User;
  wedding: Wedding;
  membership: WeddingMember;
  role: WeddingMemberRole;
  availableWeddings: AvailableWedding[];
};

export class ActiveWeddingRequiredError extends Error {
  constructor() {
    super("An active wedding is required.");
    this.name = "ActiveWeddingRequiredError";
  }
}

/**
 * Resolve the authenticated user's active wedding from active memberships.
 * The selected wedding is persisted in UserPreference and is always checked
 * against the user's current memberships before it is used.
 */
export async function getActiveWedding(options?: {
  redirectToOnboarding?: boolean;
}): Promise<ActiveWeddingContext | null> {
  const authenticatedUser = await getAuthenticatedUser();
  const memberships = await prisma.weddingMember.findMany({
    where: {
      userId: authenticatedUser.user.id,
      status: MembershipStatus.ACTIVE,
    },
    include: { wedding: true },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });

  if (memberships.length === 0) {
    if (options?.redirectToOnboarding) {
      redirect("/onboarding");
    }

    return null;
  }

  const preference = await prisma.userPreference.findUnique({
    where: { userId: authenticatedUser.user.id },
    select: { activeWeddingId: true },
  });

  const selectedMembership =
    memberships.find(
      (membership) => membership.weddingId === preference?.activeWeddingId,
    ) ?? memberships[0];

  if (preference?.activeWeddingId !== selectedMembership.weddingId) {
    await weddingRepository.setActiveWedding(
      authenticatedUser.user.id,
      selectedMembership.weddingId,
    );
  }

  return {
    user: authenticatedUser.user,
    wedding: selectedMembership.wedding,
    membership: selectedMembership,
    role: selectedMembership.role,
    availableWeddings: memberships.map(({ wedding }) => ({
      id: wedding.id,
      name: wedding.name,
      partnerOneName: wedding.partnerOneName,
      partnerTwoName: wedding.partnerTwoName,
      weddingDate: wedding.weddingDate,
      timezone: wedding.timezone,
    })),
  };
}

export async function requireWedding(): Promise<ActiveWeddingContext> {
  let context: ActiveWeddingContext | null;

  try {
    context = await getActiveWedding({ redirectToOnboarding: false });
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      redirect("/sign-in");
    }

    throw error;
  }

  if (!context) {
    redirect("/onboarding");
  }

  return context;
}

export async function requireActionWedding(): Promise<ActiveWeddingContext> {
  const context = await getActiveWedding({ redirectToOnboarding: false });

  if (!context) {
    throw new ActiveWeddingRequiredError();
  }

  return context;
}
