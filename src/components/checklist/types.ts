import type {
  AssignableMemberActionData,
  ActionResult,
  CategoryActionData,
  TaskActionData,
} from "@/src/server/actions/checklist/checklist.actions";

export type CreateCategoryAction = (
  input: unknown,
) => Promise<ActionResult<CategoryActionData>>;

export type UpdateCategoryAction = CreateCategoryAction;

export type DeleteCategoryAction = () => Promise<ActionResult<CategoryActionData>>;

export type CreateTaskAction = (
  input: unknown,
) => Promise<ActionResult<TaskActionData>>;

export type ChecklistMember = AssignableMemberActionData;

export type TaskMutationAction = () => Promise<ActionResult<TaskActionData>>;

export type TaskViewModel = {
  task: TaskActionData;
  completeAction: TaskMutationAction;
  reopenAction: TaskMutationAction;
};

export type CategoryViewModel = {
  category: CategoryActionData;
  tasks: TaskViewModel[];
  members: ChecklistMember[];
  createTaskAction: CreateTaskAction;
  updateCategoryAction: UpdateCategoryAction;
  deleteCategoryAction: DeleteCategoryAction;
};
