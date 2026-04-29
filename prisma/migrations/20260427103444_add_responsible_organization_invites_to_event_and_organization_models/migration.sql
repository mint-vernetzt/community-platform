-- AlterTable
ALTER TABLE "event_visibilities" ADD COLUMN     "profileJoinInvites" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "responsibleOrganizationInvites" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "invites_for_organizations_to_be_responsible_for_events" (
    "organization_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "status" "join_statuses" NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invites_for_organizations_to_be_responsible_for_events_pkey" PRIMARY KEY ("organization_id","event_id")
);

-- AddForeignKey
ALTER TABLE "invites_for_organizations_to_be_responsible_for_events" ADD CONSTRAINT "invites_for_organizations_to_be_responsible_for_events_org_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invites_for_organizations_to_be_responsible_for_events" ADD CONSTRAINT "invites_for_organizations_to_be_responsible_for_events_eve_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
