import { Card, ProgressBar } from "../shared/ui";

type CategoryProgress = {
  name: string;
  completed: number;
  total: number;
};

type ChecklistProgressOverviewProps = {
  completedCount: number;
  totalCount: number;
  completionPercentage: number;
  categories: CategoryProgress[];
};

export function ChecklistProgressOverview({
  completedCount,
  totalCount,
  completionPercentage,
  categories,
}: ChecklistProgressOverviewProps) {
  return (
    <Card className="mb-6 p-5 sm:px-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:gap-6">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center justify-between gap-4">
            <span className="text-[13.5px] font-semibold text-[#1C1C1C]">
              Overall Progress
            </span>
            <span className="text-[13.5px] font-bold text-[#2D5A27]">
              {completionPercentage}%
            </span>
          </div>
          <ProgressBar value={completedCount} max={totalCount} height="h-2.5" />
          <p className="mt-2 text-xs text-[#8A8A82]">
            {completedCount} of {totalCount} tasks completed
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
          {categories.slice(0, 4).map((category) => {
            const percentage =
              category.total > 0
                ? Math.round((category.completed / category.total) * 100)
                : 0;

            return (
              <div className="min-w-[66px] text-center" key={category.name}>
                <div className="text-lg font-bold tracking-[-0.02em] text-[#1C1C1C]">
                  {category.completed}/{category.total}
                </div>
                <div className="truncate text-[11px] text-[#8A8A82]" title={category.name}>
                  {category.name}
                </div>
                <div className="mt-1 text-[10px] font-semibold text-[#2D5A27]">
                  {percentage}%
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
