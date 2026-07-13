-- CreateTable
CREATE TABLE "guests" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "academic_title" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "organization_name" TEXT,
    "terms_accepted" BOOLEAN NOT NULL DEFAULT false,
    "terms_accepted_at" TIMESTAMP(3),
    "confirmation_sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "confirmed_at" TIMESTAMP(3),
    "confirmation_token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guests_of_events" (
    "guest_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "revocation_token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guests_of_events_pkey" PRIMARY KEY ("guest_id","event_id")
);

-- CreateTable
CREATE TABLE "waiting_guests_of_events" (
    "guest_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "revocation_token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "waiting_guests_of_events_pkey" PRIMARY KEY ("guest_id","event_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "guests_email_key" ON "guests"("email");

-- AddForeignKey
ALTER TABLE "guests_of_events" ADD CONSTRAINT "guests_of_events_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guests_of_events" ADD CONSTRAINT "guests_of_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waiting_guests_of_events" ADD CONSTRAINT "waiting_guests_of_events_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waiting_guests_of_events" ADD CONSTRAINT "waiting_guests_of_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
