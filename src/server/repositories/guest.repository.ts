import { randomUUID } from "node:crypto";

import {
  GuestAgeGroup,
  Prisma,
} from "../../../app/generated/prisma/client";
import { prisma } from "../db/prisma";

export type GuestFilters = {
  search?: string;
  householdId?: string;
  ageGroup?: GuestAgeGroup;
  tagId?: string;
  unassignedHousehold?: boolean;
};

export type GuestInput = {
  householdId?: string | null;
  plusOneForGuestId?: string | null;
  title?: string | null;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  ageGroup: GuestAgeGroup;
  dietaryRequirements?: string | null;
  notes?: string | null;
};

export type CreateGuestWithPlusOneInput = {
  primary: GuestInput;
  plusOne: GuestInput | null;
  primaryTagIds: string[];
};

export type PlusOneInput = Omit<GuestInput, "householdId" | "plusOneForGuestId">;

const guestInclude = {
  household: true,
  plusOneFor: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  },
  plusOnes: {
    select: {
      id: true,
      title: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      ageGroup: true,
      tagAssignments: {
        include: { tag: true },
        orderBy: { tag: { name: "asc" } },
      },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  },
  tagAssignments: {
    include: { tag: true },
    orderBy: { tag: { name: "asc" } },
  },
} satisfies Prisma.GuestInclude;

export class GuestRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GuestRepositoryError";
  }
}

export class GuestRepository {
  private buildGuestWhere(
    weddingId: string,
    filters: GuestFilters = {},
    standaloneOnly = false,
  ): Prisma.GuestWhereInput {
    const search = filters.search?.trim();
    const topLevelOnly = standaloneOnly || filters.unassignedHousehold === true;
    const and: Prisma.GuestWhereInput[] = [];

    if (topLevelOnly && filters.ageGroup) {
      and.push({
        OR: [
          { ageGroup: filters.ageGroup },
          { plusOnes: { some: { ageGroup: filters.ageGroup } } },
        ],
      });
    }

    if (topLevelOnly && filters.tagId) {
      and.push({
        OR: [
          { tagAssignments: { some: { tagId: filters.tagId } } },
          { plusOnes: { some: { tagAssignments: { some: { tagId: filters.tagId } } } } },
        ],
      });
    }

    return {
      weddingId,
      plusOneForGuestId: topLevelOnly ? null : undefined,
      householdId:
        topLevelOnly
          ? null
          : filters.householdId || undefined,
      ageGroup: topLevelOnly ? undefined : filters.ageGroup,
      tagAssignments: topLevelOnly
        ? undefined
        : filters.tagId
          ? { some: { tagId: filters.tagId } }
          : undefined,
      AND: and,
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } },
              {
                household: {
                  OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    { addressLineOne: { contains: search, mode: "insensitive" } },
                    { addressLineTwo: { contains: search, mode: "insensitive" } },
                    { townCity: { contains: search, mode: "insensitive" } },
                    { countyRegion: { contains: search, mode: "insensitive" } },
                    { postcode: { contains: search, mode: "insensitive" } },
                    { country: { contains: search, mode: "insensitive" } },
                  ],
                },
              },
              {
                plusOnes: {
                  some: {
                    OR: [
                      { firstName: { contains: search, mode: "insensitive" } },
                      { lastName: { contains: search, mode: "insensitive" } },
                      { email: { contains: search, mode: "insensitive" } },
                      { phone: { contains: search, mode: "insensitive" } },
                    ],
                  },
                },
              },
            ],
          }
        : {}),
    };
  }

  private async ensureGuestBelongsToWedding(guestId: string, weddingId: string) {
    const guest = await prisma.guest.findFirst({
      where: { id: guestId, weddingId },
      select: { id: true },
    });

    if (!guest) {
      throw new GuestRepositoryError("Guest not found");
    }
  }

  private async validateGuestReferences(
    weddingId: string,
    input: Pick<GuestInput, "householdId" | "plusOneForGuestId">,
    currentGuestId?: string,
  ) {
    if (input.householdId) {
      const household = await prisma.household.findFirst({
        where: { id: input.householdId, weddingId },
        select: { id: true },
      });

      if (!household) {
        throw new GuestRepositoryError("Household not found in this wedding");
      }
    }

    if (input.plusOneForGuestId) {
      if (input.plusOneForGuestId === currentGuestId) {
        throw new GuestRepositoryError("A guest cannot be their own plus-one");
      }

      const plusOneTarget = await prisma.guest.findFirst({
        where: { id: input.plusOneForGuestId, weddingId },
        select: {
          id: true,
          plusOneForGuestId: true,
          plusOnes: { select: { id: true } },
        },
      });

      if (!plusOneTarget) {
        throw new GuestRepositoryError(
          "Plus-one target not found in this wedding",
        );
      }

      if (plusOneTarget.plusOneForGuestId) {
        throw new GuestRepositoryError(
          "A plus-one cannot have another plus-one",
        );
      }
      if (plusOneTarget.plusOnes.length > 0) {
        throw new GuestRepositoryError("This guest already has a plus-one");
      }
    }
  }

  async listGuests(weddingId: string, filters: GuestFilters = {}) {
    try {
      return await prisma.guest.findMany({
        where: this.buildGuestWhere(weddingId, filters),
        include: guestInclude,
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      });
    } catch (error) {
      console.error("[guest-repository] list guests failed", error);
      throw new GuestRepositoryError("Unable to load guests");
    }
  }

  async listStandaloneGuests(weddingId: string, filters: GuestFilters = {}) {
    try {
      if (filters.householdId) return [];

      return await prisma.guest.findMany({
        where: this.buildGuestWhere(weddingId, filters, true),
        include: guestInclude,
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      });
    } catch (error) {
      console.error(
        "[guest-repository] list standalone guests failed",
        error,
      );
      throw new GuestRepositoryError("Unable to load standalone guests");
    }
  }

  async searchGuests(weddingId: string, search: string) {
    return this.listGuests(weddingId, { search });
  }

  async getGuest(weddingId: string, guestId: string) {
    try {
      const guest = await prisma.guest.findFirst({
        where: { id: guestId, weddingId },
        include: guestInclude,
      });

      if (!guest) {
        throw new GuestRepositoryError("Guest not found");
      }

      return guest;
    } catch (error) {
      if (error instanceof GuestRepositoryError) throw error;
      console.error("[guest-repository] get guest failed", error);
      throw new GuestRepositoryError("Unable to load guest");
    }
  }

  async createGuest(weddingId: string, input: GuestInput) {
    try {
      await this.validateGuestReferences(weddingId, input);

      return await prisma.guest.create({
        data: { weddingId, ...input },
        include: guestInclude,
      });
    } catch (error) {
      if (error instanceof GuestRepositoryError) throw error;
      console.error("[guest-repository] create guest failed", error);
      throw new GuestRepositoryError("Unable to create guest");
    }
  }

  async createGuestWithPlusOne(
    weddingId: string,
    input: CreateGuestWithPlusOneInput,
  ) {
    try {
      await this.validateGuestReferences(weddingId, input.primary);

      if (input.primary.plusOneForGuestId && input.plusOne) {
        throw new GuestRepositoryError(
          "A plus-one cannot have another plus-one",
        );
      }

      const tagIds = [...new Set(input.primaryTagIds)];
      const tagCount = await prisma.guestTag.count({
        where: { id: { in: tagIds }, weddingId },
      });

      if (tagCount !== tagIds.length) {
        throw new GuestRepositoryError("One or more tags were not found");
      }

      const primaryId = randomUUID();
      const plusOneId = input.plusOne ? randomUUID() : null;
      const plusOne = input.plusOne
        ? {
            ...input.plusOne,
            householdId: input.primary.householdId ?? null,
            plusOneForGuestId: primaryId,
          }
        : null;

      await prisma.$transaction([
        prisma.guest.create({
          data: { id: primaryId, weddingId, ...input.primary },
        }),
        ...(plusOne && plusOneId
          ? [
              prisma.guest.create({
                data: { id: plusOneId, weddingId, ...plusOne },
              }),
            ]
          : []),
        ...tagIds.map((tagId) =>
          prisma.guestTagAssignment.create({
            data: { guestId: primaryId, tagId },
          }),
        ),
      ]);

      return this.getGuest(weddingId, primaryId);
    } catch (error) {
      if (error instanceof GuestRepositoryError) throw error;
      console.error(
        "[guest-repository] create guest with plus-one failed",
        error,
      );
      throw new GuestRepositoryError("Unable to create guest");
    }
  }

  async addPlusOne(
    weddingId: string,
    guestId: string,
    input: PlusOneInput,
  ) {
    try {
      const parent = await prisma.guest.findFirst({
        where: { id: guestId, weddingId },
        select: {
          id: true,
          householdId: true,
          plusOneForGuestId: true,
          plusOnes: { select: { id: true } },
        },
      });

      if (!parent) throw new GuestRepositoryError("Guest not found");
      if (parent.plusOneForGuestId) {
        throw new GuestRepositoryError(
          "A plus-one cannot have another plus-one",
        );
      }
      if (parent.plusOnes.length > 0) {
        throw new GuestRepositoryError("This guest already has a plus-one");
      }

      const plusOneId = randomUUID();
      await prisma.$transaction([
        prisma.guest.create({
          data: {
            id: plusOneId,
            weddingId,
            ...input,
            householdId: parent.householdId,
            plusOneForGuestId: parent.id,
          },
        }),
      ]);

      return this.getGuest(weddingId, guestId);
    } catch (error) {
      if (error instanceof GuestRepositoryError) throw error;
      console.error("[guest-repository] add plus-one failed", error);
      throw new GuestRepositoryError("Unable to add plus-one");
    }
  }

  async attachExistingGuestAsPlusOne(
    weddingId: string,
    parentGuestId: string,
    plusOneGuestId: string,
  ) {
    try {
      if (parentGuestId === plusOneGuestId) {
        throw new GuestRepositoryError("A guest cannot be their own plus-one");
      }

      const parent = await prisma.guest.findFirst({
        where: { id: parentGuestId, weddingId },
        select: {
          id: true,
          householdId: true,
          plusOneForGuestId: true,
          plusOnes: { select: { id: true } },
        },
      });
      const plusOne = await prisma.guest.findFirst({
        where: { id: plusOneGuestId, weddingId },
        select: {
          id: true,
          householdId: true,
          plusOneForGuestId: true,
          plusOnes: { select: { id: true } },
          household: { select: { primaryGuestId: true } },
        },
      });

      if (!parent || !plusOne) {
        throw new GuestRepositoryError("Guest not found in this wedding");
      }
      if (parent.plusOneForGuestId) {
        throw new GuestRepositoryError(
          "A plus-one cannot have another plus-one",
        );
      }
      if (parent.plusOnes.length > 0) {
        throw new GuestRepositoryError("This guest already has a plus-one");
      }
      if (plusOne.plusOneForGuestId) {
        throw new GuestRepositoryError("This guest is already a plus-one");
      }
      if (plusOne.plusOnes.length > 0) {
        throw new GuestRepositoryError(
          "A guest with a plus-one cannot become a plus-one",
        );
      }
      if (plusOne.household?.primaryGuestId === plusOne.id) {
        throw new GuestRepositoryError(
          "Change this guest's household primary invitee before attaching them as a plus-one",
        );
      }
      if (
        plusOne.householdId &&
        plusOne.householdId !== parent.householdId
      ) {
        throw new GuestRepositoryError(
          "Move this guest out of their current household before attaching them as a plus-one",
        );
      }

      await prisma.$transaction([
        prisma.guest.update({
          where: { id: plusOne.id },
          data: {
            householdId: parent.householdId,
            plusOneForGuestId: parent.id,
          },
        }),
      ]);

      return this.getGuest(weddingId, parent.id);
    } catch (error) {
      if (error instanceof GuestRepositoryError) throw error;
      console.error(
        "[guest-repository] attach existing plus-one failed",
        error,
      );
      throw new GuestRepositoryError("Unable to attach existing plus-one");
    }
  }

  async updateGuest(weddingId: string, guestId: string, input: GuestInput) {
    try {
      const currentGuest = await prisma.guest.findFirst({
        where: { id: guestId, weddingId },
        select: {
          id: true,
          householdId: true,
          household: { select: { primaryGuestId: true } },
        },
      });

      if (!currentGuest) throw new GuestRepositoryError("Guest not found");
      await this.validateGuestReferences(weddingId, input, guestId);

      const movingHousehold = currentGuest.householdId !== input.householdId;
      const shouldClearPrimary =
        movingHousehold && currentGuest.household?.primaryGuestId === guestId;

      if (shouldClearPrimary) {
        await prisma.$transaction([
          prisma.household.updateMany({
            where: { weddingId, primaryGuestId: guestId },
            data: { primaryGuestId: null },
          }),
          prisma.guest.update({
            where: { id: guestId },
            data: input,
          }),
        ]);
        return this.getGuest(weddingId, guestId);
      }

      return await prisma.guest.update({
        where: { id: guestId },
        data: input,
        include: guestInclude,
      });
    } catch (error) {
      if (error instanceof GuestRepositoryError) throw error;
      console.error("[guest-repository] update guest failed", error);
      throw new GuestRepositoryError("Unable to update guest");
    }
  }

  async deleteGuest(weddingId: string, guestId: string) {
    try {
      await this.ensureGuestBelongsToWedding(guestId, weddingId);
      await prisma.$transaction([
        prisma.household.updateMany({
          where: { weddingId, primaryGuestId: guestId },
          data: { primaryGuestId: null },
        }),
        prisma.guest.delete({ where: { id: guestId } }),
      ]);
    } catch (error) {
      if (error instanceof GuestRepositoryError) throw error;
      console.error("[guest-repository] delete guest failed", error);
      throw new GuestRepositoryError("Unable to delete guest");
    }
  }

  async assignGuestToHousehold(
    weddingId: string,
    guestId: string,
    householdId: string,
  ) {
    try {
      const currentGuest = await prisma.guest.findFirst({
        where: { id: guestId, weddingId },
        select: {
          id: true,
          householdId: true,
          household: { select: { primaryGuestId: true } },
        },
      });

      if (!currentGuest) throw new GuestRepositoryError("Guest not found");
      await this.validateGuestReferences(weddingId, { householdId });

      const operations = [];
      if (
        currentGuest.householdId !== householdId &&
        currentGuest.household?.primaryGuestId === guestId
      ) {
        operations.push(
          prisma.household.updateMany({
            where: { weddingId, primaryGuestId: guestId },
            data: { primaryGuestId: null },
          }),
        );
      }
      operations.push(
        prisma.guest.update({
          where: { id: guestId },
          data: { householdId },
        }),
      );

      await prisma.$transaction(operations);
      return this.getGuest(weddingId, guestId);
    } catch (error) {
      if (error instanceof GuestRepositoryError) throw error;
      console.error("[guest-repository] assign guest to household failed", error);
      throw new GuestRepositoryError("Unable to assign guest to household");
    }
  }

  async removeGuestFromHousehold(weddingId: string, guestId: string) {
    try {
      await this.ensureGuestBelongsToWedding(guestId, weddingId);
      await prisma.$transaction([
        prisma.household.updateMany({
          where: { weddingId, primaryGuestId: guestId },
          data: { primaryGuestId: null },
        }),
        prisma.guest.update({
          where: { id: guestId },
          data: { householdId: null },
        }),
      ]);
      return this.getGuest(weddingId, guestId);
    } catch (error) {
      if (error instanceof GuestRepositoryError) throw error;
      console.error("[guest-repository] remove guest from household failed", error);
      throw new GuestRepositoryError("Unable to remove guest from household");
    }
  }

  async removePlusOneRelationship(weddingId: string, guestId: string) {
    try {
      await this.ensureGuestBelongsToWedding(guestId, weddingId);

      return await prisma.guest.update({
        where: { id: guestId },
        data: { plusOneForGuestId: null },
        include: guestInclude,
      });
    } catch (error) {
      if (error instanceof GuestRepositoryError) throw error;
      console.error(
        "[guest-repository] remove plus-one relationship failed",
        error,
      );
      throw new GuestRepositoryError("Unable to remove plus-one relationship");
    }
  }

  async setGuestTags(weddingId: string, guestId: string, tagIds: string[]) {
    try {
      await this.ensureGuestBelongsToWedding(guestId, weddingId);
      const uniqueTagIds = [...new Set(tagIds)];

      const tagCount = await prisma.guestTag.count({
        where: { id: { in: uniqueTagIds }, weddingId },
      });

      if (tagCount !== uniqueTagIds.length) {
        throw new GuestRepositoryError("One or more tags were not found");
      }

      await prisma.$transaction([
        prisma.guestTagAssignment.deleteMany({ where: { guestId } }),
        prisma.guestTagAssignment.createMany({
          data: uniqueTagIds.map((tagId) => ({ guestId, tagId })),
          skipDuplicates: true,
        }),
      ]);

      return this.getGuest(weddingId, guestId);
    } catch (error) {
      if (error instanceof GuestRepositoryError) throw error;
      console.error("[guest-repository] set guest tags failed", error);
      throw new GuestRepositoryError("Unable to update guest tags");
    }
  }
}

export const guestRepository = new GuestRepository();
