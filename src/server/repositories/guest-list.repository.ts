import "server-only";

import {
  GuestAgeGroup,
  Prisma,
} from "../../../app/generated/prisma/client";
import { prisma } from "../db/prisma";
import { logger } from "../logging/logger";
import {
  firstError,
  guestAgeGroups,
  parseEnum,
  parseId,
  parseOptionalBoolean,
  parseOptionalText,
  parsedValue,
} from "../actions/guests/validation";

export type GuestListTag = {
  id: string;
  name: string;
};

export type GuestListName = {
  id: string;
  firstName: string;
  lastName: string;
};

export type GuestListPlusOne = {
  id: string;
  title: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  ageGroup: GuestAgeGroup;
  tags: GuestListTag[];
  plusOneFor?: GuestListName | null;
};

export type GuestListStandaloneGuest = {
  id: string;
  title: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  ageGroup: GuestAgeGroup;
  tags: GuestListTag[];
  plusOneFor: null;
  plusOnes: GuestListPlusOne[];
};

export type GuestListHouseholdGuest = {
  id: string;
  title: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  ageGroup: GuestAgeGroup;
  tags: GuestListTag[];
  plusOneFor: GuestListName | null;
  plusOnes: { id: string }[];
};

export type GuestListHousehold = {
  id: string;
  name: string;
  addressLineOne: string;
  townCity: string;
  primaryGuestId: string | null;
  primaryGuest: GuestListName | null;
  guests: GuestListHouseholdGuest[];
};

export type GuestListData = {
  standaloneGuests: GuestListStandaloneGuest[];
  households: GuestListHousehold[];
  tags: GuestListTag[];
};

export type GuestListFilters = {
  search?: string;
  householdId?: string;
  ageGroup?: GuestAgeGroup;
  tagId?: string;
  unassignedHousehold?: boolean;
};

export type GuestListFiltersInput = {
  search?: unknown;
  householdId?: unknown;
  ageGroup?: unknown;
  tagId?: unknown;
  unassignedHousehold?: unknown;
};

export type GuestListFilterResult =
  | { value: GuestListFilters }
  | { error: string };

const guestListTagSelect = {
  id: true,
  name: true,
} satisfies Prisma.GuestTagSelect;

const standaloneGuestSelect = {
  id: true,
  title: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  ageGroup: true,
  tagAssignments: {
    select: {
      tag: { select: guestListTagSelect },
    },
    orderBy: { tag: { name: "asc" } },
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
        select: {
          tag: { select: guestListTagSelect },
        },
        orderBy: { tag: { name: "asc" } },
      },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  },
} satisfies Prisma.GuestSelect;

const householdSelect = {
  id: true,
  name: true,
  addressLineOne: true,
  townCity: true,
  primaryGuestId: true,
  primaryGuest: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  },
  guests: {
    select: {
      id: true,
      title: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      ageGroup: true,
      tagAssignments: {
        select: {
          tag: { select: guestListTagSelect },
        },
        orderBy: { tag: { name: "asc" } },
      },
      plusOneFor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      plusOnes: {
        select: { id: true },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  },
} satisfies Prisma.HouseholdSelect;

type StandaloneGuestRecord = Prisma.GuestGetPayload<{
  select: typeof standaloneGuestSelect;
}>;

type HouseholdRecord = Prisma.HouseholdGetPayload<{
  select: typeof householdSelect;
}>;

export class GuestListRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GuestListRepositoryError";
  }
}

export function parseGuestListFilters(
  input: GuestListFiltersInput = {},
): GuestListFilterResult {
  const search = parseOptionalText(input.search, "Search", 100);
  const householdId =
    input.householdId === undefined || input.householdId === ""
      ? { value: undefined }
      : parseId(input.householdId, "Household");
  const tagId =
    input.tagId === undefined || input.tagId === ""
      ? { value: undefined }
      : parseId(input.tagId, "Tag");
  const ageGroup =
    input.ageGroup === undefined || input.ageGroup === ""
      ? { value: undefined }
      : parseEnum(input.ageGroup, "Age group", guestAgeGroups);
  const unassignedHousehold = parseOptionalBoolean(input.unassignedHousehold);
  const error = firstError(
    search,
    householdId,
    tagId,
    ageGroup,
    unassignedHousehold,
  );

  if (error) return { error };

  return {
    value: {
      search: parsedValue(search) ?? undefined,
      householdId: parsedValue(householdId),
      ageGroup: parsedValue(ageGroup),
      tagId: parsedValue(tagId),
      unassignedHousehold: parsedValue(unassignedHousehold),
    },
  };
}

function buildStandaloneGuestWhere(
  weddingId: string,
  filters: GuestListFilters = {},
): Prisma.GuestWhereInput {
  const search = filters.search?.trim();
  const and: Prisma.GuestWhereInput[] = [];

  if (filters.ageGroup) {
    and.push({
      OR: [
        { ageGroup: filters.ageGroup },
        { plusOnes: { some: { ageGroup: filters.ageGroup } } },
      ],
    });
  }

  if (filters.tagId) {
    and.push({
      OR: [
        { tagAssignments: { some: { tagId: filters.tagId } } },
        {
          plusOnes: {
            some: { tagAssignments: { some: { tagId: filters.tagId } } },
          },
        },
      ],
    });
  }

  return {
    weddingId,
    plusOneForGuestId: null,
    householdId: null,
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

function buildHouseholdWhere(
  weddingId: string,
  filters: GuestListFilters = {},
): Prisma.HouseholdWhereInput {
  const search = filters.search?.trim();
  const and: Prisma.HouseholdWhereInput[] = [];

  if (search) {
    and.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { addressLineOne: { contains: search, mode: "insensitive" } },
        { addressLineTwo: { contains: search, mode: "insensitive" } },
        { townCity: { contains: search, mode: "insensitive" } },
        { countyRegion: { contains: search, mode: "insensitive" } },
        { postcode: { contains: search, mode: "insensitive" } },
        { country: { contains: search, mode: "insensitive" } },
        {
          primaryGuest: {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
            ],
          },
        },
        {
          guests: {
            some: {
              OR: [
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } },
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
            },
          },
        },
      ],
    });
  }

  if (filters.ageGroup) {
    and.push({ guests: { some: { ageGroup: filters.ageGroup } } });
  }

  if (filters.tagId) {
    and.push({
      guests: {
        some: { tagAssignments: { some: { tagId: filters.tagId } } },
      },
    });
  }

  return {
    weddingId,
    id: filters.householdId,
    AND: and,
  };
}

function mapTags(
  assignments: Array<{ tag: GuestListTag }>,
): GuestListTag[] {
  return assignments.map(({ tag }) => tag);
}

function mapStandaloneGuest(guest: StandaloneGuestRecord): GuestListStandaloneGuest {
  return {
    id: guest.id,
    title: guest.title,
    firstName: guest.firstName,
    lastName: guest.lastName,
    email: guest.email,
    phone: guest.phone,
    ageGroup: guest.ageGroup,
    tags: mapTags(guest.tagAssignments),
    plusOneFor: null,
    plusOnes: guest.plusOnes.map((plusOne) => ({
      id: plusOne.id,
      title: plusOne.title,
      firstName: plusOne.firstName,
      lastName: plusOne.lastName,
      email: plusOne.email,
      phone: plusOne.phone,
      ageGroup: plusOne.ageGroup,
      tags: mapTags(plusOne.tagAssignments),
    })),
  };
}

function mapHousehold(household: HouseholdRecord): GuestListHousehold {
  return {
    id: household.id,
    name: household.name,
    addressLineOne: household.addressLineOne,
    townCity: household.townCity,
    primaryGuestId: household.primaryGuestId,
    primaryGuest: household.primaryGuest,
    guests: household.guests.map((guest) => ({
      id: guest.id,
      title: guest.title,
      firstName: guest.firstName,
      lastName: guest.lastName,
      email: guest.email,
      phone: guest.phone,
      ageGroup: guest.ageGroup,
      tags: mapTags(guest.tagAssignments),
      plusOneFor: guest.plusOneFor,
      plusOnes: guest.plusOnes,
    })),
  };
}

export class GuestListRepository {
  async getGuestList(
    weddingId: string,
    filters: GuestListFilters = {},
  ): Promise<GuestListData> {
    const standaloneGuests = await this.listStandaloneGuests(weddingId, filters);
    const households = await this.listHouseholds(weddingId, filters);
    const tags = await this.listTags(weddingId);

    return { standaloneGuests, households, tags };
  }

  private async listStandaloneGuests(
    weddingId: string,
    filters: GuestListFilters,
  ): Promise<GuestListStandaloneGuest[]> {
    try {
      if (filters.householdId) return [];

      const guests = await prisma.guest.findMany({
        where: buildStandaloneGuestWhere(weddingId, filters),
        select: standaloneGuestSelect,
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      });

      return guests.map(mapStandaloneGuest);
    } catch (error) {
      logger.error("[guest-list-repository] list standalone guests failed", error);
      throw new GuestListRepositoryError("Unable to load standalone guests");
    }
  }

  private async listHouseholds(
    weddingId: string,
    filters: GuestListFilters,
  ): Promise<GuestListHousehold[]> {
    try {
      if (filters.unassignedHousehold) return [];

      const households = await prisma.household.findMany({
        where: buildHouseholdWhere(weddingId, filters),
        select: householdSelect,
        orderBy: [{ name: "asc" }],
      });

      return households.map(mapHousehold);
    } catch (error) {
      logger.error("[guest-list-repository] list households failed", error);
      throw new GuestListRepositoryError("Unable to load households");
    }
  }

  private async listTags(weddingId: string): Promise<GuestListTag[]> {
    try {
      return await prisma.guestTag.findMany({
        where: { weddingId },
        orderBy: [{ name: "asc" }],
        select: guestListTagSelect,
      });
    } catch (error) {
      logger.error("[guest-list-repository] list guest tags failed", error);
      throw new GuestListRepositoryError("Unable to load guest tags");
    }
  }
}

export const guestListRepository = new GuestListRepository();
