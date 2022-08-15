-- DropForeignKey
ALTER TABLE "events" DROP CONSTRAINT "events_experience_level_id_fkey";

-- AlterTable
ALTER TABLE "events" ALTER COLUMN "experience_level_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_experience_level_id_fkey" FOREIGN KEY ("experience_level_id") REFERENCES "experience_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;
