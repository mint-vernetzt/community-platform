/*
  Warnings:

  - You are about to drop the `_OrganizationToOrganizationType` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `areas_on_organization` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_OrganizationToOrganizationType" DROP CONSTRAINT "_OrganizationToOrganizationType_A_fkey";

-- DropForeignKey
ALTER TABLE "_OrganizationToOrganizationType" DROP CONSTRAINT "_OrganizationToOrganizationType_B_fkey";

-- DropForeignKey
ALTER TABLE "areas_on_organization" DROP CONSTRAINT "areas_on_organization_areaId_fkey";

-- DropForeignKey
ALTER TABLE "areas_on_organization" DROP CONSTRAINT "areas_on_organization_organizationId_fkey";

-- DropTable
DROP TABLE "_OrganizationToOrganizationType";

-- DropTable
DROP TABLE "areas_on_organization";

-- CreateTable
CREATE TABLE "areas_on_organizations" (
    "organizationId" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,

    CONSTRAINT "areas_on_organizations_pkey" PRIMARY KEY ("organizationId","areaId")
);

-- CreateTable
CREATE TABLE "organization_types_on_organizations" (
    "organizationId" TEXT NOT NULL,
    "organizationTypeId" TEXT NOT NULL,

    CONSTRAINT "organization_types_on_organizations_pkey" PRIMARY KEY ("organizationId","organizationTypeId")
);

-- AddForeignKey
ALTER TABLE "areas_on_organizations" ADD CONSTRAINT "areas_on_organizations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "areas_on_organizations" ADD CONSTRAINT "areas_on_organizations_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_types_on_organizations" ADD CONSTRAINT "organization_types_on_organizations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_types_on_organizations" ADD CONSTRAINT "organization_types_on_organizations_organizationTypeId_fkey" FOREIGN KEY ("organizationTypeId") REFERENCES "organization_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
