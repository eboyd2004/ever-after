-- CreateEnum
CREATE TYPE "task_status" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'WAITING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "task_priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "task_recurrence_frequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateTable
CREATE TABLE "task_categories" (
    "id" UUID NOT NULL,
    "wedding_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "colour" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" UUID NOT NULL,
    "wedding_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "assignee_id" UUID,
    "parent_task_id" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "task_status" NOT NULL DEFAULT 'NOT_STARTED',
    "priority" "task_priority" NOT NULL DEFAULT 'MEDIUM',
    "due_date" DATE,
    "completed_at" TIMESTAMP(3),
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_links" (
    "id" UUID NOT NULL,
    "task_id" UUID NOT NULL,
    "label" TEXT,
    "url" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_recurrences" (
    "id" UUID NOT NULL,
    "task_id" UUID NOT NULL,
    "frequency" "task_recurrence_frequency" NOT NULL,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "starts_on" DATE,
    "ends_on" DATE,
    "next_occurrence_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_recurrences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "task_categories_wedding_id_idx" ON "task_categories"("wedding_id");

-- CreateIndex
CREATE INDEX "task_categories_position_idx" ON "task_categories"("position");

-- CreateIndex
CREATE UNIQUE INDEX "task_categories_wedding_id_name_key" ON "task_categories"("wedding_id", "name");

-- CreateIndex
CREATE INDEX "tasks_wedding_id_idx" ON "tasks"("wedding_id");

-- CreateIndex
CREATE INDEX "tasks_category_id_idx" ON "tasks"("category_id");

-- CreateIndex
CREATE INDEX "tasks_assignee_id_idx" ON "tasks"("assignee_id");

-- CreateIndex
CREATE INDEX "tasks_parent_task_id_idx" ON "tasks"("parent_task_id");

-- CreateIndex
CREATE INDEX "tasks_status_idx" ON "tasks"("status");

-- CreateIndex
CREATE INDEX "tasks_priority_idx" ON "tasks"("priority");

-- CreateIndex
CREATE INDEX "tasks_due_date_idx" ON "tasks"("due_date");

-- CreateIndex
CREATE INDEX "tasks_wedding_id_status_idx" ON "tasks"("wedding_id", "status");

-- CreateIndex
CREATE INDEX "tasks_wedding_id_due_date_idx" ON "tasks"("wedding_id", "due_date");

-- CreateIndex
CREATE INDEX "task_links_task_id_idx" ON "task_links"("task_id");

-- CreateIndex
CREATE INDEX "task_links_task_id_position_idx" ON "task_links"("task_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "task_recurrences_task_id_key" ON "task_recurrences"("task_id");

-- CreateIndex
CREATE INDEX "task_recurrences_next_occurrence_at_idx" ON "task_recurrences"("next_occurrence_at");

-- CreateIndex
CREATE INDEX "task_recurrences_frequency_idx" ON "task_recurrences"("frequency");

-- AddForeignKey
ALTER TABLE "task_categories" ADD CONSTRAINT "task_categories_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "task_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "wedding_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_parent_task_id_fkey" FOREIGN KEY ("parent_task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_links" ADD CONSTRAINT "task_links_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_recurrences" ADD CONSTRAINT "task_recurrences_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
