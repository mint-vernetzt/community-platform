-- AlterTable
ALTER TABLE "event_visibilities" ADD COLUMN     "participantInvites" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "profile_visibilities" ADD COLUMN     "participantOnEventInvites" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "invites_for_profiles_to_participate_on_events" (
    "profile_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "status" "join_statuses" NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invites_for_profiles_to_participate_on_events_pkey" PRIMARY KEY ("profile_id","event_id")
);

-- AddForeignKey
ALTER TABLE "invites_for_profiles_to_participate_on_events" ADD CONSTRAINT "invites_for_profiles_to_participate_on_events_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invites_for_profiles_to_participate_on_events" ADD CONSTRAINT "invites_for_profiles_to_participate_on_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
