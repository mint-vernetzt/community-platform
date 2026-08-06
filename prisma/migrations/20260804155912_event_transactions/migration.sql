-- CreateEnum
CREATE TYPE "EventTransactionState" AS ENUM ('open', 'processing', 'failed', 'sent', 'aborted');

-- AlterTable
ALTER TABLE "event_visibilities" ADD COLUMN     "eventTransactions" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "event_transactions" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "plain_text" TEXT NOT NULL,
    "html" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "scheduled_for" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "state" "EventTransactionState" NOT NULL DEFAULT 'open',
    "retries" TIMESTAMP(3)[] DEFAULT ARRAY[]::TIMESTAMP(3)[],
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_transactions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "event_transactions" ADD CONSTRAINT "event_transactions_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
