-- AlterTable
ALTER TABLE "event_visibilities" ADD COLUMN     "accessibility_information" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "accessibility_information_rte_state" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "privacy_information" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "privacy_information_rte_state" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "accessibility_information" TEXT,
ADD COLUMN     "accessibility_information_rte_state" TEXT,
ADD COLUMN     "privacy_information" TEXT,
ADD COLUMN     "privacy_information_rte_state" TEXT;
