-- CreateEnum
CREATE TYPE "claim_status" AS ENUM ('open', 'withdrawn', 'accepted', 'rejected');

-- AlterTable
ALTER TABLE "organization_visibilities" ADD COLUMN     "claimRequests" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "profile_visibilities" ADD COLUMN     "claimOrganizationRequests" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "organization_claim_requests" (
    "id" TEXT NOT NULL,
    "status" "claim_status" NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "claimer_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,

    CONSTRAINT "organization_claim_requests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "organization_claim_requests" ADD CONSTRAINT "organization_claim_requests_claimer_id_fkey" FOREIGN KEY ("claimer_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_claim_requests" ADD CONSTRAINT "organization_claim_requests_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
