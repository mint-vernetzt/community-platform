-- CreateTable
CREATE TABLE "mint_focuses_on_organizations" (
    "organizationId" TEXT NOT NULL,
    "mintFocusId" TEXT NOT NULL,

    CONSTRAINT "mint_focuses_on_organizations_pkey" PRIMARY KEY ("organizationId","mintFocusId")
);

-- CreateTable
CREATE TABLE "mint_focuses" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "mint_focuses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mint_focuses_title_key" ON "mint_focuses"("title");

-- AddForeignKey
ALTER TABLE "mint_focuses_on_organizations" ADD CONSTRAINT "mint_focuses_on_organizations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mint_focuses_on_organizations" ADD CONSTRAINT "mint_focuses_on_organizations_mintFocusId_fkey" FOREIGN KEY ("mintFocusId") REFERENCES "mint_focuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
