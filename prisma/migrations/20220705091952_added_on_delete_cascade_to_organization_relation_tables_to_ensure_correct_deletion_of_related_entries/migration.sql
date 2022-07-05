-- DropForeignKey
ALTER TABLE "members_of_networks" DROP CONSTRAINT "members_of_networks_networkId_fkey";

-- DropForeignKey
ALTER TABLE "members_of_networks" DROP CONSTRAINT "members_of_networks_networkMemberId_fkey";

-- DropForeignKey
ALTER TABLE "members_of_organizations" DROP CONSTRAINT "members_of_organizations_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "members_of_organizations" DROP CONSTRAINT "members_of_organizations_profileId_fkey";

-- AddForeignKey
ALTER TABLE "members_of_organizations" ADD CONSTRAINT "members_of_organizations_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members_of_organizations" ADD CONSTRAINT "members_of_organizations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members_of_networks" ADD CONSTRAINT "members_of_networks_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members_of_networks" ADD CONSTRAINT "members_of_networks_networkMemberId_fkey" FOREIGN KEY ("networkMemberId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
