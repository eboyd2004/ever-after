-- CreateEnum
CREATE TYPE "wedding_invitation_status" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');

-- CreateTable
CREATE TABLE "wedding_invitations" (
    "id" UUID NOT NULL,
    "wedding_id" UUID NOT NULL,
    "invited_email" TEXT NOT NULL,
    "role" "wedding_member_role" NOT NULL DEFAULT 'OWNER',
    "status" "wedding_invitation_status" NOT NULL DEFAULT 'PENDING',
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "invited_by_user_id" UUID NOT NULL,
    "accepted_by_user_id" UUID,
    "accepted_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wedding_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wedding_invitations_token_hash_key" ON "wedding_invitations"("token_hash");

-- CreateIndex
CREATE INDEX "wedding_invitations_wedding_id_idx" ON "wedding_invitations"("wedding_id");

-- CreateIndex
CREATE INDEX "wedding_invitations_invited_email_idx" ON "wedding_invitations"("invited_email");

-- CreateIndex
CREATE INDEX "wedding_invitations_status_idx" ON "wedding_invitations"("status");

-- CreateIndex
CREATE INDEX "wedding_invitations_expires_at_idx" ON "wedding_invitations"("expires_at");

-- CreateIndex
CREATE INDEX "wedding_invitations_wedding_id_invited_email_idx" ON "wedding_invitations"("wedding_id", "invited_email");

-- AddForeignKey
ALTER TABLE "wedding_invitations" ADD CONSTRAINT "wedding_invitations_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wedding_invitations" ADD CONSTRAINT "wedding_invitations_invited_by_user_id_fkey" FOREIGN KEY ("invited_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wedding_invitations" ADD CONSTRAINT "wedding_invitations_accepted_by_user_id_fkey" FOREIGN KEY ("accepted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
