-- CreateTable
CREATE TABLE "focuses_on_organizations" (
    "organizationId" TEXT NOT NULL,
    "focusId" TEXT NOT NULL,

    CONSTRAINT "focuses_on_organizations_pkey" PRIMARY KEY ("organizationId","focusId")
);

-- CreateTable
CREATE TABLE "focuses" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "focuses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "focuses_title_key" ON "focuses"("title");

-- AddForeignKey
ALTER TABLE "focuses_on_organizations" ADD CONSTRAINT "focuses_on_organizations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "focuses_on_organizations" ADD CONSTRAINT "focuses_on_organizations_focusId_fkey" FOREIGN KEY ("focusId") REFERENCES "focuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
