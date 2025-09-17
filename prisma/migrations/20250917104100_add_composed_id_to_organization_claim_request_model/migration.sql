/*
  Warnings:

  - The primary key for the `organization_claim_requests` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `organization_claim_requests` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "organization_claim_requests" DROP CONSTRAINT "organization_claim_requests_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "organization_claim_requests_pkey" PRIMARY KEY ("claimer_id", "organization_id");
