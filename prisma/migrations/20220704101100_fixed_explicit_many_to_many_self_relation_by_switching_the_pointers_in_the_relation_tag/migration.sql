/*
  Warnings:

  - The primary key for the `members_of_networks` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `organizationId` on the `members_of_networks` table. All the data in the column will be lost.
  - You are about to drop the column `umbrellaOrganizationId` on the `members_of_networks` table. All the data in the column will be lost.
  - Added the required column `networkId` to the `members_of_networks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `networkMemberId` to the `members_of_networks` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "members_of_networks" DROP CONSTRAINT "members_of_networks_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "members_of_networks" DROP CONSTRAINT "members_of_networks_umbrellaOrganizationId_fkey";

-- AlterTable
ALTER TABLE "members_of_networks" DROP CONSTRAINT "members_of_networks_pkey",
DROP COLUMN "organizationId",
DROP COLUMN "umbrellaOrganizationId",
ADD COLUMN     "networkId" TEXT NOT NULL,
ADD COLUMN     "networkMemberId" TEXT NOT NULL,
ADD CONSTRAINT "members_of_networks_pkey" PRIMARY KEY ("networkId", "networkMemberId");

-- AddForeignKey
ALTER TABLE "members_of_networks" ADD CONSTRAINT "members_of_networks_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members_of_networks" ADD CONSTRAINT "members_of_networks_networkMemberId_fkey" FOREIGN KEY ("networkMemberId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
