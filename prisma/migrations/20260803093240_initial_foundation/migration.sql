-- CreateEnum
CREATE TYPE "wedding_member_role" AS ENUM ('OWNER', 'EDITOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "membership_status" AS ENUM ('INVITED', 'ACTIVE', 'LEFT', 'REMOVED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "auth_provider_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "profile_image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "theme" TEXT NOT NULL,
    "timezone" TEXT,
    "email_notifications_enabled" BOOLEAN NOT NULL,
    "task_notifications_enabled" BOOLEAN NOT NULL,
    "payment_notifications_enabled" BOOLEAN NOT NULL,
    "additional_preferences" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weddings" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "partner_one_name" TEXT NOT NULL,
    "partner_two_name" TEXT NOT NULL,
    "wedding_date" DATE NOT NULL,
    "ceremony_location" TEXT,
    "reception_location" TEXT,
    "timezone" TEXT NOT NULL,
    "currency_code" TEXT NOT NULL,
    "total_budget_minor" BIGINT,
    "meal_choices_enabled" BOOLEAN NOT NULL,
    "dietary_requirements_enabled" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wedding_members" (
    "id" UUID NOT NULL,
    "wedding_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "wedding_member_role" NOT NULL,
    "status" "membership_status" NOT NULL,
    "joined_at" TIMESTAMP(3),
    "left_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wedding_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_auth_provider_id_key" ON "users"("auth_provider_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_name_idx" ON "users"("last_name", "first_name");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_user_id_key" ON "user_preferences"("user_id");

-- CreateIndex
CREATE INDEX "weddings_wedding_date_idx" ON "weddings"("wedding_date");

-- CreateIndex
CREATE INDEX "wedding_members_wedding_id_idx" ON "wedding_members"("wedding_id");

-- CreateIndex
CREATE INDEX "wedding_members_user_id_idx" ON "wedding_members"("user_id");

-- CreateIndex
CREATE INDEX "wedding_members_wedding_id_role_status_idx" ON "wedding_members"("wedding_id", "role", "status");

-- CreateIndex
CREATE UNIQUE INDEX "wedding_members_wedding_id_user_id_key" ON "wedding_members"("wedding_id", "user_id");

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wedding_members" ADD CONSTRAINT "wedding_members_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wedding_members" ADD CONSTRAINT "wedding_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
