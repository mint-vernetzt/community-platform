/*
  Warnings:

  - You are about to drop the column `type` on the `organizations` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "organizations" DROP COLUMN "type",
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "street" DROP NOT NULL,
ALTER COLUMN "city" DROP NOT NULL,
ALTER COLUMN "street_number" DROP NOT NULL,
ALTER COLUMN "zip_code" DROP NOT NULL;

-- CreateTable
CREATE TABLE "areas_on_organization" (
    "organizationId" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,

    CONSTRAINT "areas_on_organization_pkey" PRIMARY KEY ("organizationId","areaId")
);

-- CreateTable
CREATE TABLE "organization_types" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "organization_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_OrganizationToOrganizationType" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "organization_types_title_key" ON "organization_types"("title");

-- CreateIndex
CREATE UNIQUE INDEX "_OrganizationToOrganizationType_AB_unique" ON "_OrganizationToOrganizationType"("A", "B");

-- CreateIndex
CREATE INDEX "_OrganizationToOrganizationType_B_index" ON "_OrganizationToOrganizationType"("B");

-- AddForeignKey
ALTER TABLE "areas_on_organization" ADD CONSTRAINT "areas_on_organization_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "areas_on_organization" ADD CONSTRAINT "areas_on_organization_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OrganizationToOrganizationType" ADD FOREIGN KEY ("A") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OrganizationToOrganizationType" ADD FOREIGN KEY ("B") REFERENCES "organization_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
