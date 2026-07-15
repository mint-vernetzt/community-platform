/*
  Warnings:

  - You are about to drop the column `transaction_token` on the `guests` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "guests" DROP COLUMN "transaction_token",
ADD COLUMN     "confirmation_token" TEXT;
