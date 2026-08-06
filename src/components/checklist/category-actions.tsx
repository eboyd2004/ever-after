"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { ConfirmDialog } from "../shared/confirm-dialog";
import { Modal } from "../shared/modal";
import { CreateCategoryForm } from "./create-category-form";
import { CreateTaskForm } from "./create-task-form";
import type {
  CategoryViewModel,
} from "./types";

type CategoryActionsProps = Pick<
  CategoryViewModel,
  | "category"
  | "createTaskAction"
  | "deleteCategoryAction"
  | "members"
  | "updateCategoryAction"
>;

export function CategoryActions({
  category,
  createTaskAction,
  deleteCategoryAction,
  members,
  updateCategoryAction,
}: CategoryActionsProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);

    startTransition(async () => {
      const result = await deleteCategoryAction();

      if (!result.success) {
        setError(result.error);
        setDeleteOpen(false);
        return;
      }

      setDeleteOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-2 border-b border-[#F4F4F1] px-4 py-2.5 sm:px-5">
        <CreateTaskForm action={createTaskAction} compact members={members} />
        <button
          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#6B6B63] transition hover:bg-[#F4F4F1] hover:text-[#1C1C1C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]"
          onClick={() => {
            setError(null);
            setEditOpen(true);
          }}
          type="button"
        >
          Edit category
        </button>
        <button
          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#9D3F32] transition hover:bg-[#FFF5F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9D3F32]"
          onClick={() => {
            setError(null);
            setDeleteOpen(true);
          }}
          type="button"
        >
          Delete category
        </button>
      </div>

      {error ? (
        <p
          aria-live="polite"
          className="border-b border-[#E7C9C5] bg-[#FFF5F3] px-4 py-2 text-xs text-[#9D3F32] sm:px-5"
        >
          {error}
        </p>
      ) : null}

      <Modal
        description="Update this checklist category."
        onClose={() => setEditOpen(false)}
        open={editOpen}
        title={`Edit ${category.name}`}
      >
        <CreateCategoryForm
          action={updateCategoryAction}
          embedded
          initialValues={{
            colour: category.colour,
            icon: category.icon,
            name: category.name,
          }}
          onSuccess={() => {
            setEditOpen(false);
            router.refresh();
          }}
          submitLabel="Save changes"
          successMessage="Category updated."
        />
      </Modal>

      <ConfirmDialog
        confirmLabel="Delete category"
        description="Deleting this category will also permanently delete all tasks in it. This cannot be undone."
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        open={deleteOpen}
        pending={isPending}
        title={`Delete ${category.name}?`}
      />
    </>
  );
}
