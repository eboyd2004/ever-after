"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { ConfirmDialog } from "../shared/confirm-dialog";
import { Icon } from "../shared/icons";
import { Modal } from "../shared/modal";
import { TaskForm } from "./task-form";
import type {
  ChecklistCategoryOption,
  ChecklistMember,
  TaskMutationAction,
  TaskViewModel,
} from "./types";

type TaskActionsProps = {
  categories: ChecklistCategoryOption[];
  deleteAction: TaskMutationAction;
  members: ChecklistMember[];
  task: TaskViewModel["task"];
  updateAction: TaskViewModel["updateAction"];
};

export function TaskActions({
  categories,
  deleteAction,
  members,
  task,
  updateAction,
}: TaskActionsProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);

    startTransition(async () => {
      try {
        const result = await deleteAction();

        if (!result.success) {
          setError(result.error);
          setDeleteOpen(false);
          return;
        }

        setDeleteOpen(false);
        router.refresh();
      } catch {
        setError("Unable to delete the task. Please try again.");
        setDeleteOpen(false);
      }
    });
  }

  return (
    <>
      <div className="flex shrink-0 items-center gap-1">
        <button
          aria-label={`Edit task ${task.title}`}
          aria-haspopup="dialog"
          className="rounded-md p-1.5 text-[#6B6B63] transition hover:bg-[#EAF0E8] hover:text-[#2D5A27] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]"
          onClick={() => {
            setError(null);
            setEditOpen(true);
          }}
          title="Edit task"
          type="button"
        >
          <Icon name="edit" size={15} />
        </button>
        <button
          aria-label={`Delete task ${task.title}`}
          aria-haspopup="dialog"
          className="rounded-md p-1.5 text-[#9D3F32] transition hover:bg-[#FFF5F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9D3F32]"
          onClick={() => {
            setError(null);
            setDeleteOpen(true);
          }}
          title="Delete task"
          type="button"
        >
          <Icon name="trash" size={15} />
        </button>
      </div>

      {error ? (
        <p
          aria-live="polite"
          className="absolute right-2 top-full z-10 mt-1 max-w-60 rounded-md border border-[#E7C9C5] bg-[#FFF5F3] px-2 py-1 text-right text-[11px] text-[#9D3F32] shadow-sm"
        >
          {error}
        </p>
      ) : null}

      <Modal
        description="Update the fields available for this checklist task."
        onClose={() => setEditOpen(false)}
        open={editOpen}
        title={`Edit ${task.title}`}
      >
        <TaskForm
          action={updateAction}
          categories={categories}
          initialValues={{
            assigneeId: task.assigneeId,
            categoryId: task.categoryId,
            description: task.description,
            dueDate: task.dueDate,
            priority: task.priority,
            status: task.status,
            title: task.title,
          }}
          members={members}
          mode="edit"
          onCancel={() => setEditOpen(false)}
          onSuccess={() => {
            setEditOpen(false);
            router.refresh();
          }}
        />
      </Modal>

      <ConfirmDialog
        confirmLabel="Delete task"
        description={`This will permanently delete “${task.title}”. This cannot be undone.`}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        open={deleteOpen}
        pending={isPending}
        title={`Delete ${task.title}?`}
      />
    </>
  );
}
