/*
  Warnings:

  - A unique constraint covering the columns `[primary_guest_id]` on the table `households` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "households" ADD COLUMN     "primary_guest_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "households_primary_guest_id_key" ON "households"("primary_guest_id");

-- AddForeignKey
ALTER TABLE "households" ADD CONSTRAINT "households_primary_guest_id_fkey" FOREIGN KEY ("primary_guest_id") REFERENCES "guests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
