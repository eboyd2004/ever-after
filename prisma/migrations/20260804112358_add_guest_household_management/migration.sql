-- CreateEnum
CREATE TYPE "guest_age_group" AS ENUM ('ADULT', 'CHILD', 'INFANT');

-- CreateTable
CREATE TABLE "households" (
    "id" UUID NOT NULL,
    "wedding_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "address_line_one" TEXT NOT NULL,
    "address_line_two" TEXT,
    "town_city" TEXT NOT NULL,
    "county_region" TEXT,
    "postcode" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "households_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guests" (
    "id" UUID NOT NULL,
    "wedding_id" UUID NOT NULL,
    "household_id" UUID,
    "plus_one_for_guest_id" UUID,
    "title" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "age_group" "guest_age_group" NOT NULL DEFAULT 'ADULT',
    "dietary_requirements" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_tags" (
    "id" UUID NOT NULL,
    "wedding_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "colour" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guest_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_tag_assignments" (
    "guest_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guest_tag_assignments_pkey" PRIMARY KEY ("guest_id","tag_id")
);

-- CreateTable
CREATE TABLE "wedding_sections" (
    "id" UUID NOT NULL,
    "wedding_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wedding_sections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "households_wedding_id_idx" ON "households"("wedding_id");

-- CreateIndex
CREATE INDEX "households_wedding_id_name_idx" ON "households"("wedding_id", "name");

-- CreateIndex
CREATE INDEX "households_postcode_idx" ON "households"("postcode");

-- CreateIndex
CREATE INDEX "guests_wedding_id_idx" ON "guests"("wedding_id");

-- CreateIndex
CREATE INDEX "guests_household_id_idx" ON "guests"("household_id");

-- CreateIndex
CREATE INDEX "guests_plus_one_for_guest_id_idx" ON "guests"("plus_one_for_guest_id");

-- CreateIndex
CREATE INDEX "guests_last_name_idx" ON "guests"("last_name");

-- CreateIndex
CREATE INDEX "guests_email_idx" ON "guests"("email");

-- CreateIndex
CREATE INDEX "guests_wedding_id_last_name_idx" ON "guests"("wedding_id", "last_name");

-- CreateIndex
CREATE INDEX "guests_wedding_id_household_id_idx" ON "guests"("wedding_id", "household_id");

-- CreateIndex
CREATE INDEX "guest_tags_wedding_id_idx" ON "guest_tags"("wedding_id");

-- CreateIndex
CREATE INDEX "guest_tags_name_idx" ON "guest_tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "guest_tags_wedding_id_name_key" ON "guest_tags"("wedding_id", "name");

-- CreateIndex
CREATE INDEX "guest_tag_assignments_tag_id_idx" ON "guest_tag_assignments"("tag_id");

-- CreateIndex
CREATE INDEX "wedding_sections_wedding_id_idx" ON "wedding_sections"("wedding_id");

-- CreateIndex
CREATE INDEX "wedding_sections_wedding_id_position_idx" ON "wedding_sections"("wedding_id", "position");

-- CreateIndex
CREATE INDEX "wedding_sections_active_idx" ON "wedding_sections"("active");

-- CreateIndex
CREATE UNIQUE INDEX "wedding_sections_wedding_id_name_key" ON "wedding_sections"("wedding_id", "name");

-- AddForeignKey
ALTER TABLE "households" ADD CONSTRAINT "households_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guests" ADD CONSTRAINT "guests_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guests" ADD CONSTRAINT "guests_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guests" ADD CONSTRAINT "guests_plus_one_for_guest_id_fkey" FOREIGN KEY ("plus_one_for_guest_id") REFERENCES "guests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_tags" ADD CONSTRAINT "guest_tags_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_tag_assignments" ADD CONSTRAINT "guest_tag_assignments_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_tag_assignments" ADD CONSTRAINT "guest_tag_assignments_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "guest_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wedding_sections" ADD CONSTRAINT "wedding_sections_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
