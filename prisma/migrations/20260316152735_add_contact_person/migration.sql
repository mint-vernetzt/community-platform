-- AlterTable
ALTER TABLE "event_visibilities" ADD COLUMN     "contactPersons" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "profile_visibilities" ADD COLUMN     "contactPersonsOfEvents" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "contact_persons_of_events" (
    "event_id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,

    CONSTRAINT "contact_persons_of_events_pkey" PRIMARY KEY ("event_id","profile_id")
);

-- AddForeignKey
ALTER TABLE "contact_persons_of_events" ADD CONSTRAINT "contact_persons_of_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_persons_of_events" ADD CONSTRAINT "contact_persons_of_events_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
