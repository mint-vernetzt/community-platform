-- CreateEnum
CREATE TYPE "event_reminder_type" AS ENUM ('oneDayBefore', 'oneHourBefore', 'fifteenMinutesBefore');

-- AlterTable
ALTER TABLE "event_visibilities" ADD COLUMN     "activeReminderMails" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "guests" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "participation_token" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reminderState" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "active_reminder_mails" "event_reminder_type"[] DEFAULT ARRAY['oneDayBefore', 'oneHourBefore', 'fifteenMinutesBefore']::"event_reminder_type"[];
