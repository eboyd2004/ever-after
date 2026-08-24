"use client";

import { useRef, useState, useTransition } from "react";
import type { FormEvent } from "react";

import { Icon } from "../shared/icons";
import { Modal } from "../shared/modal";
import type { ChecklistMember, CreateTaskAction } from "./types";

type CreateTaskFormProps = {
  action: CreateTaskAction;
  compact?: boolean;
  members: ChecklistMember[];
};

export function CreateTaskForm({
  action,
  compact = false,
  members,
}: CreateTaskFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function openForm() {
    setMessage(null);
    setIsError(false);
    setIsOpen(true);
  }

  function closeForm() {
    if (isPending) return;

    formRef.current?.reset();
    setMessage(null);
    setIsError(false);
    setIsOpen(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? "").trim();

    if (!title) {
      setIsError(true);
      setMessage("Task title is required.");
      return;
    }

    const dueDate = String(formData.get("dueDate") ?? "").trim();
    const assigneeId = String(formData.get("assigneeId") ?? "").trim();
    const input = {
      title,
      description: String(formData.get("description") ?? "").trim() || undefined,
      priority: String(formData.get("priority") ?? "MEDIUM"),
      dueDate: dueDate || undefined,
      ...(assigneeId ? { assigneeId } : {}),
    };

    setMessage(null);
    setIsError(false);

    startTransition(async () => {
      const result = await action(input);

      if (!result.success) {
        setIsError(true);
        setMessage(result.error);
        return;
      }

      formRef.current?.reset();
      setIsError(false);
      setMessage(null);
      setIsOpen(false);
    });
  }

  return (
    <>
      <div className={compact ? "" : "mt-4 border-t border-dashed border-[#E4E0D4] px-2 pt-4"}>
        <button
          className="inline-flex items-center gap-2 rounded-[10px] border border-[#E8E8E3] bg-white px-3.5 py-2 text-sm font-medium text-[#2D5A27] transition hover:border-[#2D5A27] hover:bg-[#F7FAF6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27] focus-visible:ring-offset-2"
          onClick={openForm}
          type="button"
        >
          <Icon name="plus" size={16} />
          Add task
        </button>
      </div>

      <Modal
        description="Add a task to this checklist category."
        onClose={closeForm}
        open={isOpen}
        title="Add task"
      >
        <form ref={formRef} className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="mb-1 block text-xs font-medium text-[#6B6B63]">Title</span>
              <input
                autoFocus
                required
                name="title"
                type="text"
                maxLength={200}
                placeholder="What needs doing?"
                className="w-full rounded-[10px] border border-[#E8E8E3] px-3 py-2 text-sm outline-none transition focus:border-[#2D5A27] focus:ring-2 focus:ring-[#EAF0E8]"
              />
            </label>

            <label className="sm:col-span-2">
              <span className="mb-1 block text-xs font-medium text-[#6B6B63]">
                Description
              </span>
              <textarea
                name="description"
                rows={3}
                maxLength={10_000}
                placeholder="Optional notes"
                className="w-full resize-y rounded-[10px] border border-[#E8E8E3] px-3 py-2 text-sm outline-none transition focus:border-[#2D5A27] focus:ring-2 focus:ring-[#EAF0E8]"
              />
            </label>

            <label>
              <span className="mb-1 block text-xs font-medium text-[#6B6B63]">Priority</span>
              <select
                name="priority"
                defaultValue="MEDIUM"
                className="w-full rounded-[10px] border border-[#E8E8E3] bg-white px-3 py-2 text-sm outline-none transition focus:border-[#2D5A27] focus:ring-2 focus:ring-[#EAF0E8]"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </label>

            <label>
              <span className="mb-1 block text-xs font-medium text-[#6B6B63]">Due date</span>
              <input
                name="dueDate"
                type="date"
                className="w-full rounded-[10px] border border-[#E8E8E3] px-3 py-2 text-sm outline-none transition focus:border-[#2D5A27] focus:ring-2 focus:ring-[#EAF0E8]"
              />
            </label>

            <label className="sm:col-span-2">
              <span className="mb-1 block text-xs font-medium text-[#6B6B63]">
                Assignee
              </span>
              <select
                className="w-full rounded-[10px] border border-[#E8E8E3] bg-white px-3 py-2 text-sm outline-none transition focus:border-[#2D5A27] focus:ring-2 focus:ring-[#EAF0E8]"
                defaultValue=""
                name="assigneeId"
              >
                <option value="">Unassigned</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.firstName} {member.lastName}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {message ? (
            <p aria-live="polite" className={isError ? "text-sm text-red-600" : "text-sm text-emerald-700"}>
              {message}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 border-t border-[#F0EFEA] pt-4">
            <button
              className="rounded-[10px] px-4 py-2 text-sm font-medium text-[#6B6B63] transition hover:bg-[#F4F4F1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isPending}
              onClick={closeForm}
              type="button"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-[10px] bg-[#2D5A27] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#245020] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? "Adding…" : "Add task"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
