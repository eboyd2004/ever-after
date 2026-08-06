import { CategoryActions } from "./category-actions";
import { isCategoryIcon } from "./category-options";
import { TaskRow } from "./task-row";
import { Icon } from "../shared/icons";
import { Badge, ProgressBar } from "../shared/ui";
import type { CategoryViewModel } from "./types";

type CategorySectionProps = CategoryViewModel & {
  canEdit: boolean;
};

export function CategorySection({
  category,
  canEdit,
  tasks,
  createTaskAction,
  deleteCategoryAction,
  updateCategoryAction,
}: CategorySectionProps) {
  const completedCount = tasks.filter(
    (taskViewModel) => taskViewModel.task.status === "COMPLETED",
  ).length;
  const completionPercentage =
    tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  const categoryIcon = category.icon && isCategoryIcon(category.icon)
    ? category.icon
    : null;

  return (
    <details className="group overflow-hidden rounded-[14px] border border-[#E8E8E3] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]" open>
      <summary className="flex cursor-pointer list-none items-center gap-3 border-b border-[#F4F4F1] px-4 py-3.5 hover:bg-[#F7F7F4] sm:px-5">
        <span className="text-[#8A8A82] group-open:hidden">
          <Icon name="chevron-right" size={16} />
        </span>
        <span className="hidden text-[#8A8A82] group-open:inline">
          <Icon name="chevron-down" size={16} />
        </span>
        {categoryIcon ? (
          <span aria-label={`${categoryIcon} icon`} className="text-[#2D5A27]">
            <Icon name={categoryIcon} size={17} />
          </span>
        ) : null}
        <span className="min-w-0 truncate text-sm font-semibold text-[#1C1C1C]">
          {category.name}
        </span>
        <Badge>
          {completedCount}/{tasks.length}
        </Badge>
        <ProgressBar
          className="hidden max-w-[120px] flex-1 sm:block"
          height="h-1"
          value={completedCount}
          max={tasks.length}
        />
        <span className="ml-auto text-xs font-semibold text-[#2D5A27]">
          {completionPercentage}%
        </span>
      </summary>

      {canEdit ? (
        <CategoryActions
          category={category}
          createTaskAction={createTaskAction}
          deleteCategoryAction={deleteCategoryAction}
          updateCategoryAction={updateCategoryAction}
        />
      ) : null}

      <div className="p-2 sm:p-3">
        {tasks.length > 0 ? (
          <ul>
            {tasks.map((taskViewModel) => (
              <TaskRow
                canEdit={canEdit}
                key={taskViewModel.task.id}
                {...taskViewModel}
              />
            ))}
          </ul>
        ) : (
          <p className="rounded-lg border border-dashed border-[#E4E0D4] px-4 py-5 text-sm text-[#8A8A82]">
            No tasks in this category yet.
          </p>
        )}
      </div>
    </details>
  );
}
