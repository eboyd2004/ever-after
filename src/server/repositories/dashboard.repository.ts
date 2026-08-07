import "server-only";

import { prisma } from "../db/prisma";
import { logger } from "../logging/logger";

export type DashboardTask = {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: Date | null;
};

export type DashboardSummary = {
  guestCount: number;
  unassignedGuestCount: number;
  householdCount: number;
  tasks: DashboardTask[];
};

export class DashboardRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DashboardRepositoryError";
  }
}

export class DashboardRepository {
  async getDashboardSummary(weddingId: string): Promise<DashboardSummary> {
    try {
      const [guestCounts, householdCount, tasks] = await Promise.all([
        prisma.guest.groupBy({
          by: ["householdId"],
          where: { weddingId },
          _count: { _all: true },
        }),
        prisma.household.count({
          where: { weddingId },
        }),
        prisma.task.findMany({
          where: { weddingId },
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
          },
          orderBy: [
            { category: { position: "asc" } },
            { category: { createdAt: "asc" } },
            { position: "asc" },
            { createdAt: "asc" },
          ],
        }),
      ]);

      const guestCount = guestCounts.reduce(
        (total, group) => total + group._count._all,
        0,
      );
      const unassignedGuestCount =
        guestCounts.find((group) => group.householdId === null)?._count._all ?? 0;

      return {
        guestCount,
        unassignedGuestCount,
        householdCount,
        tasks,
      };
    } catch (error) {
      logger.error("[dashboard-repository] load summary failed", error);
      throw new DashboardRepositoryError("Unable to load dashboard summary");
    }
  }
}

export const dashboardRepository = new DashboardRepository();
