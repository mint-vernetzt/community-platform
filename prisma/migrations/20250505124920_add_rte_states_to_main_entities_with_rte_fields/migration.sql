-- AlterTable
ALTER TABLE "event_visibilities" ADD COLUMN     "description_rte_state" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "description_rte_state" TEXT;

-- AlterTable
ALTER TABLE "organization_visibilities" ADD COLUMN     "bio_rte_state" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "bio_rte_state" TEXT;

-- AlterTable
ALTER TABLE "profile_visibilities" ADD COLUMN     "bio_rte_state" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "bio_rte_state" TEXT;

-- AlterTable
ALTER TABLE "project_visibilities" ADD COLUMN     "further_description_rte_state" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "further_financings_rte_state" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "further_job_fillings_rte_state" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "further_room_situation_rte_state" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "further_technical_requirements_rte_state" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "goals_rte_state" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hints_rte_state" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "idea_rte_state" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "implementation_rte_state" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "job_fillings_rte_state" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "room_situation_rte_state" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "targeting_rte_state" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "technical_requirements_rte_state" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "timeframe_rte_state" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "further_description_rte_state" TEXT,
ADD COLUMN     "further_financings_rte_state" TEXT,
ADD COLUMN     "further_job_fillings_rte_state" TEXT,
ADD COLUMN     "further_room_situation_rte_state" TEXT,
ADD COLUMN     "further_technical_requirements_rte_state" TEXT,
ADD COLUMN     "goals_rte_state" TEXT,
ADD COLUMN     "hints_rte_state" TEXT,
ADD COLUMN     "idea_rte_state" TEXT,
ADD COLUMN     "implementation_rte_state" TEXT,
ADD COLUMN     "job_fillings_rte_state" TEXT,
ADD COLUMN     "room_situation_rte_state" TEXT,
ADD COLUMN     "targeting_rte_state" TEXT,
ADD COLUMN     "technical_requirements_rte_state" TEXT,
ADD COLUMN     "timeframe_rte_state" TEXT;
