-- CreateEnum
CREATE TYPE "event_reminder_state" AS ENUM ('open', 'firstScheduled', 'secondScheduled', 'lastScheduled');

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "reminder_state" "event_reminder_state" NOT NULL DEFAULT 'open';
