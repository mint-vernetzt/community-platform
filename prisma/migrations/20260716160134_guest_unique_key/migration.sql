/*
  Warnings:

  - A unique constraint covering the columns `[email,event_id]` on the table `guests` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "guests_email_event_id_key" ON "guests"("email", "event_id");
