-- CreateEnum
CREATE TYPE "event_roles" AS ENUM ('admin', 'member');

-- CreateTable
CREATE TABLE "invites_for_profiles_to_join_events" (
    "profile_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "role" "event_roles" NOT NULL,
    "status" "join_statuses" NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invites_for_profiles_to_join_events_pkey" PRIMARY KEY ("profile_id","event_id","role")
);

-- AddForeignKey
ALTER TABLE "invites_for_profiles_to_join_events" ADD CONSTRAINT "invites_for_profiles_to_join_events_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invites_for_profiles_to_join_events" ADD CONSTRAINT "invites_for_profiles_to_join_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
