-- CreateEnum
CREATE TYPE "inactivity_reminder_states" AS ENUM ('firstSent', 'secondSent', 'lastSent');

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "inactivity_reminder_sent_at" TIMESTAMP(3),
ADD COLUMN     "inactivity_reminder_state" "inactivity_reminder_states";

-- CreateTable
CREATE TABLE "inactive_profiles" (
    "id" TEXT NOT NULL,
    "json_data" TEXT NOT NULL,

    CONSTRAINT "inactive_profiles_pkey" PRIMARY KEY ("id")
);
