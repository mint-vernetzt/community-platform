-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "academicTitle" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "website" TEXT,
    "avatar" TEXT,
    "background" TEXT,
    "facebook" TEXT,
    "linkedin" TEXT,
    "twitter" TEXT,
    "xing" TEXT,
    "job" TEXT,
    "bio" TEXT,
    "skills" TEXT[],
    "interests" TEXT[],
    "publicFields" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "street" TEXT NOT NULL,
    "streetNumber" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "website" TEXT,
    "logo" TEXT,
    "background" TEXT,
    "facebook" TEXT,
    "linkedin" TEXT,
    "twitter" TEXT,
    "xing" TEXT,
    "bio" TEXT,
    "type" TEXT,
    "quote" TEXT,
    "quoteAuthor" TEXT,
    "quoteAuthorInformation" TEXT,
    "supportedBy" TEXT[],
    "publicFields" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "members_of_organizations" (
    "profileId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "isPrivileged" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "members_of_organizations_pkey" PRIMARY KEY ("profileId","organizationId")
);

-- CreateTable
CREATE TABLE "members_of_networks" (
    "organizationId" TEXT NOT NULL,
    "umbrellaOrganizationId" TEXT NOT NULL,

    CONSTRAINT "members_of_networks_pkey" PRIMARY KEY ("organizationId","umbrellaOrganizationId")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_username_key" ON "profiles"("username");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- AddForeignKey
ALTER TABLE "members_of_organizations" ADD CONSTRAINT "members_of_organizations_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members_of_organizations" ADD CONSTRAINT "members_of_organizations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members_of_networks" ADD CONSTRAINT "members_of_networks_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members_of_networks" ADD CONSTRAINT "members_of_networks_umbrellaOrganizationId_fkey" FOREIGN KEY ("umbrellaOrganizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
