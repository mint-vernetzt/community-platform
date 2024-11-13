-- AlterTable
ALTER TABLE "organization_visibilities" ADD COLUMN     "networkTypes" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "network_types_on_organizations" (
    "organizationId" TEXT NOT NULL,
    "networkTypeId" TEXT NOT NULL,

    CONSTRAINT "network_types_on_organizations_pkey" PRIMARY KEY ("organizationId","networkTypeId")
);

-- CreateTable
CREATE TABLE "network_types" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "network_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "network_types_slug_key" ON "network_types"("slug");

-- AddForeignKey
ALTER TABLE "network_types_on_organizations" ADD CONSTRAINT "network_types_on_organizations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "network_types_on_organizations" ADD CONSTRAINT "network_types_on_organizations_networkTypeId_fkey" FOREIGN KEY ("networkTypeId") REFERENCES "network_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
