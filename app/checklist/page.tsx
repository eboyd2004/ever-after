import type { ActionResult } from "@/src/server/actions/checklist/checklist.actions";
import {
  completeTask as completeTaskAction,
  createCategory as createCategoryAction,
  createTask as createTaskAction,
  deleteCategory as deleteCategoryAction,
  getCategories,
  getAssignableMembers,
  getTasks,
  reopenTask as reopenTaskAction,
  updateCategory as updateCategoryAction,
} from "@/src/server/actions/checklist/checklist.actions";
import { CategoryList } from "@/src/components/checklist/category-list";
import { ChecklistPageHeader } from "@/src/components/checklist/checklist-page-header";
import { ChecklistProgressOverview } from "@/src/components/checklist/checklist-progress-overview";
import { ChecklistToolbar } from "@/src/components/checklist/checklist-toolbar";
import type {
  AssignableMemberActionData,
  CategoryActionData,
  TaskActionData,
} from "@/src/server/actions/checklist/checklist.actions";
import type { CategoryViewModel } from "@/src/components/checklist/types";
import { requireWedding, type ActiveWeddingContext } from "@/src/server/auth/get-active-wedding";
import { logger } from "@/src/server/logging/logger";

export const dynamic = "force-dynamic";

function formatWeddingDate(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "long",
    timeZone: timezone,
  }).format(date);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "Unable to load the checklist. Make sure the database is running and try again.";
}

type LoadedChecklistData = {
  context: ActiveWeddingContext;
  categories: Array<{
    category: CategoryActionData;
    tasks: TaskActionData[];
  }>;
  members: AssignableMemberActionData[];
};

async function loadChecklistData(): Promise<
  { data: LoadedChecklistData } | { error: string }
> {
  const context = await requireWedding();

  try {
    const categoriesResult = await getCategories();

    if (!categoriesResult.success) {
      return { error: categoriesResult.error };
    }

    const categories: LoadedChecklistData["categories"] = [];

    for (const category of categoriesResult.data) {
      const tasksResult = await getTasks(category.id);

      if (!tasksResult.success) {
        return { error: tasksResult.error };
      }

      categories.push({ category, tasks: tasksResult.data });
    }

    const membersResult = await getAssignableMembers();

    if (!membersResult.success) {
      return { error: membersResult.error };
    }

    return { data: { context, categories, members: membersResult.data } };
  } catch (error) {
    logger.error("[checklist] page data load failed", error);
    return { error: getErrorMessage(error) };
  }
}

function ChecklistError({ message }: { message: string }) {
  return (
    <div className="flex min-h-[420px] items-center">
      <section className="w-full rounded-[14px] border border-[#E7C9C5] bg-[#FFF5F3] p-6 text-[#5C211B]">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-red-700">
          Checklist unavailable
        </p>
        <h1 className="mt-2 text-2xl font-semibold">Your checklist is not ready</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-red-900">{message}</p>
      </section>
    </div>
  );
}

export default async function ChecklistPage() {
  const loaded = await loadChecklistData();

  if ("error" in loaded) {
    return <ChecklistError message={loaded.error} />;
  }

  const { context, categories, members } = loaded.data;
  const canEdit = context.role !== "VIEWER";

  const allTasks = categories.flatMap(({ tasks }) => tasks);
  const totalTaskCount = allTasks.length;
  const completedTaskCount = allTasks.filter(
    (task) => task.status === "COMPLETED",
  ).length;
  const completionPercentage =
    totalTaskCount > 0
      ? Math.round((completedTaskCount / totalTaskCount) * 100)
      : 0;

  const createCategoryForWedding = async (
    input: unknown,
  ): Promise<ActionResult<CategoryActionData>> => {
    "use server";

    return createCategoryAction(input);
  };

  const categoryViewModels: CategoryViewModel[] = [];

  for (const { category, tasks } of categories) {
    const categoryId = category.id;
    const createTaskForCategory = async (
      input: unknown,
    ): Promise<ActionResult<TaskActionData>> => {
      "use server";

      return createTaskAction({
        ...(typeof input === "object" && input !== null && !Array.isArray(input)
          ? input
          : {}),
        categoryId,
      });
    };

    const updateCategoryForWedding = async (
      input: unknown,
    ): Promise<ActionResult<CategoryActionData>> => {
      "use server";

      return updateCategoryAction(categoryId, input);
    };

    const deleteCategoryForWedding = async (): Promise<
      ActionResult<CategoryActionData>
    > => {
      "use server";

      return deleteCategoryAction(categoryId);
    };

    const taskViewModels = tasks.map((task) => {
      const taskId = task.id;
      const isCompleted = task.status === "COMPLETED";

      const completeTaskForWedding = async (): Promise<
        ActionResult<TaskActionData>
      > => {
        "use server";

        return completeTaskAction(taskId);
      };

      const reopenTaskForWedding = async (): Promise<
        ActionResult<TaskActionData>
      > => {
        "use server";

        return reopenTaskAction(taskId);
      };

      return {
        task,
        completeAction: isCompleted
          ? reopenTaskForWedding
          : completeTaskForWedding,
        reopenAction: reopenTaskForWedding,
      };
    });

    categoryViewModels.push({
      category,
      members,
      tasks: taskViewModels,
      createTaskAction: createTaskForCategory,
      updateCategoryAction: updateCategoryForWedding,
      deleteCategoryAction: deleteCategoryForWedding,
    });
  }

  const categoryProgress = categories.map(({ category, tasks }) => ({
    name: category.name,
    completed: tasks.filter((task) => task.status === "COMPLETED").length,
    total: tasks.length,
  }));
  const priorities = Array.from(
    new Set(allTasks.map((task) => task.priority)),
  ).map((priority) =>
    priority
      .toLowerCase()
      .replace(/^./, (character) => character.toUpperCase()),
  );

  return (
    <div className="space-y-8">
      <ChecklistPageHeader
        completedCount={completedTaskCount}
        completionPercentage={completionPercentage}
        canEdit={canEdit}
        createCategoryAction={createCategoryForWedding}
        totalCount={totalTaskCount}
        weddingDate={formatWeddingDate(
          context.wedding.weddingDate,
          context.wedding.timezone,
        )}
        weddingName={context.wedding.name}
      />

      <ChecklistProgressOverview
        categories={categoryProgress}
        completedCount={completedTaskCount}
        completionPercentage={completionPercentage}
        totalCount={totalTaskCount}
      />

      <ChecklistToolbar
        categoryNames={categories.map(({ category }) => category.name)}
        completedCount={completedTaskCount}
        incompleteCount={totalTaskCount - completedTaskCount}
        priorities={priorities}
        totalCount={totalTaskCount}
      />

      <CategoryList canEdit={canEdit} categories={categoryViewModels} />
    </div>
  );
}
