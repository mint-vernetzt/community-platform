-- CreateTable
CREATE TABLE "ProfileScore" (
    "id" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    "profile_id" TEXT,

    CONSTRAINT "ProfileScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationScore" (
    "id" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    "organization_id" TEXT,

    CONSTRAINT "OrganizationScore_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProfileScore" ADD CONSTRAINT "ProfileScore_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationScore" ADD CONSTRAINT "OrganizationScore_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
