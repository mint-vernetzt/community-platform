-- AlterTable
ALTER TABLE "event_visibilities" ADD COLUMN     "receivedParentEventJoinRequests" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sentParentEventJoinRequests" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "requests_to_parent_events_to_add_child_events" (
    "parent_event_id" TEXT NOT NULL,
    "child_event_id" TEXT NOT NULL,
    "status" "join_statuses" NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "requests_to_parent_events_to_add_child_events_pkey" PRIMARY KEY ("parent_event_id","child_event_id")
);

-- AddForeignKey
ALTER TABLE "requests_to_parent_events_to_add_child_events" ADD CONSTRAINT "requests_to_parent_events_to_add_child_events_parent_event_fkey" FOREIGN KEY ("parent_event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests_to_parent_events_to_add_child_events" ADD CONSTRAINT "requests_to_parent_events_to_add_child_events_child_event__fkey" FOREIGN KEY ("child_event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
