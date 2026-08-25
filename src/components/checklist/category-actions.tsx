"use client";

import { useState, useTransition } from "react";

import { ConfirmDialog } from "../shared/confirm-dialog";
import { Icon } from "../shared/icons";
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
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);

    startTransition(async () => {
      try {
        const result = await deleteCategoryAction();

        if (!result.success) {
          setError(result.error);
          setDeleteOpen(false);
          return;
        }

        setDeleteOpen(false);
      } catch {
        setError("Unable to delete the category. Please try again.");
        setDeleteOpen(false);
      }
    });
  }

  return (
    <>
      <div className="absolute right-3 top-2 z-20 flex items-center gap-1">
        <CreateTaskForm action={createTaskAction} compact members={members} />
        <button
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          aria-label={`Category actions for ${category.name}`}
          className="rounded-md p-1.5 text-[#6B6B63] transition hover:bg-[#F4F4F1] hover:text-[#1C1C1C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]"
          onClick={() => setMenuOpen((open) => !open)}
          title="Category actions"
          type="button"
        >
          <Icon name="more" size={17} />
        </button>
        <div
          className="absolute right-0 top-full mt-1 min-w-40 rounded-lg border border-[#E8E8E3] bg-white p-1 shadow-[0_8px_24px_rgba(28,28,28,0.12)]"
          hidden={!menuOpen}
          role="menu"
        >
          <button
            className="block w-full rounded-md px-3 py-2 text-left text-xs font-medium text-[#6B6B63] hover:bg-[#F4F4F1] hover:text-[#1C1C1C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]"
            onClick={() => {
              setError(null);
              setMenuOpen(false);
              setEditOpen(true);
            }}
            role="menuitem"
            type="button"
          >
            Edit category
          </button>
          <button
            className="block w-full rounded-md px-3 py-2 text-left text-xs font-medium text-[#9D3F32] hover:bg-[#FFF5F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9D3F32]"
            onClick={() => {
              setError(null);
              setMenuOpen(false);
              setDeleteOpen(true);
            }}
            role="menuitem"
            type="button"
          >
            Delete category
          </button>
        </div>
      </div>

      {error ? (
        <p
          aria-live="polite"
          className="absolute right-3 top-11 z-10 max-w-60 rounded-md border border-[#E7C9C5] bg-[#FFF5F3] px-2 py-1 text-right text-[11px] text-[#9D3F32] shadow-sm"
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
