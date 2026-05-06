-- AlterTable
ALTER TABLE "event_visibilities" ADD COLUMN     "eventVisibility" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "filterVector" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "organization_visibilities" ADD COLUMN     "filterVector" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "organizationVisibility" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "public_fields" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "receivedNetworkJoinInvites" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "receivedNetworkJoinRequests" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "responsibleForEventInvites" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sentNetworkJoinInvites" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sentNetworkJoinRequests" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "profile_visibilities" ADD COLUMN     "filterVector" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "joinEventInvites" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "profileVisibility" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "public_fields" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "project_visibilities" ADD COLUMN     "filter_vector" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "projectVisibility" BOOLEAN NOT NULL DEFAULT true;
