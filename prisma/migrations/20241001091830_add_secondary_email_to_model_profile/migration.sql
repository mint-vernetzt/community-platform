-- AlterTable
ALTER TABLE "profile_visibilities" ADD COLUMN     "email2" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "email2" TEXT;
