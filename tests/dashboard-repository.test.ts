import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    guest: { groupBy: vi.fn() },
    household: { count: vi.fn() },
    task: { findMany: vi.fn() },
  },
}));

vi.mock("server-only", () => ({}));
vi.mock("../src/server/db/prisma", () => ({ prisma: mocks.prisma }));
vi.mock("../src/server/logging/logger", () => ({
  logger: { error: vi.fn() },
}));

import { dashboardRepository } from "../src/server/repositories/dashboard.repository";

describe("dashboardRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.prisma.guest.groupBy.mockResolvedValue([
      { householdId: null, _count: { _all: 2 } },
      { householdId: "household_1", _count: { _all: 3 } },
    ]);
    mocks.prisma.household.count.mockResolvedValue(2);
    mocks.prisma.task.findMany.mockResolvedValue([
      {
        id: "task_1",
        title: "Book photographer",
        status: "NOT_STARTED",
        priority: "HIGH",
        dueDate: new Date("2026-06-01T00:00:00.000Z"),
      },
    ]);
  });

  it("scopes all dashboard queries to the supplied wedding", async () => {
    const result = await dashboardRepository.getDashboardSummary("wedding_1");

    expect(result.guestCount).toBe(5);
    expect(result.unassignedGuestCount).toBe(2);
    expect(result.householdCount).toBe(2);

    expect(mocks.prisma.guest.groupBy).toHaveBeenCalledWith({
      by: ["householdId"],
      where: { weddingId: "wedding_1" },
      _count: { _all: true },
    });
    expect(mocks.prisma.household.count).toHaveBeenCalledWith({
      where: { weddingId: "wedding_1" },
    });
    expect(mocks.prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { weddingId: "wedding_1" } }),
    );
  });

  it("requests only dashboard task fields without category loading", async () => {
    await dashboardRepository.getDashboardSummary("wedding_1");

    expect(mocks.prisma.task.findMany).toHaveBeenCalledWith({
      where: { weddingId: "wedding_1" },
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
    });
    expect(mocks.prisma.task.findMany).toHaveBeenCalledOnce();
    expect(mocks.prisma).not.toHaveProperty("taskCategory");
  });

  it("returns only tasks returned from the wedding-scoped task query", async () => {
    mocks.prisma.task.findMany.mockImplementation(async (args) => {
      expect(args.where).toEqual({ weddingId: "wedding_1" });
      return [
        {
          id: "task_1",
          title: "Book photographer",
          status: "NOT_STARTED",
          priority: "HIGH",
          dueDate: null,
        },
      ];
    });

    const result = await dashboardRepository.getDashboardSummary("wedding_1");

    expect(result.tasks).toEqual([
      {
        id: "task_1",
        title: "Book photographer",
        status: "NOT_STARTED",
        priority: "HIGH",
        dueDate: null,
      },
    ]);
  });
});
