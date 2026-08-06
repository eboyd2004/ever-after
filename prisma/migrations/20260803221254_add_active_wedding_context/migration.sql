-- AlterTable
ALTER TABLE "user_preferences" ADD COLUMN     "active_wedding_id" UUID;

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_active_wedding_id_fkey" FOREIGN KEY ("active_wedding_id") REFERENCES "weddings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
