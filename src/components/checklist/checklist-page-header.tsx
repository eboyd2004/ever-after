import { Button } from "../shared/ui";
import { PageHeader } from "../shared/page-header";
import { ManageCategoriesModal } from "./manage-categories-modal";
import type { CreateCategoryAction } from "./types";

type ChecklistPageHeaderProps = {
  weddingName: string;
  weddingDate: string;
  completedCount: number;
  totalCount: number;
  completionPercentage: number;
  canEdit: boolean;
  createCategoryAction: CreateCategoryAction;
};

export function ChecklistPageHeader({
  weddingName,
  weddingDate,
  completedCount,
  totalCount,
  completionPercentage,
  canEdit,
  createCategoryAction,
}: ChecklistPageHeaderProps) {
  return (
    <PageHeader
      description={
        <>
          {completedCount} of {totalCount} tasks completed — you&apos;re {completionPercentage}% there!
          <span className="mt-1 block text-xs">Wedding date: {weddingDate}</span>
        </>
      }
      eyebrow={weddingName}
      title="Wedding Checklist"
      actions={
        <div className="flex flex-wrap items-center gap-2">
        <Button aria-current="page" variant="secondary" type="button">
          List
        </Button>
        <Button
          aria-disabled="true"
          disabled
          title="Kanban is deferred until status-column behaviour is defined"
          type="button"
        >
          Kanban
        </Button>
        {canEdit ? (
          <ManageCategoriesModal action={createCategoryAction} />
        ) : null}
        </div>
      }
    />
  );
}
