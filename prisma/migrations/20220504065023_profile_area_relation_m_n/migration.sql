-- CreateTable
CREATE TABLE "AreasOnProfiles" (
    "profileId" TEXT NOT NULL,
    "areaId" INTEGER NOT NULL,

    CONSTRAINT "AreasOnProfiles_pkey" PRIMARY KEY ("profileId","areaId")
);

-- AddForeignKey
ALTER TABLE "AreasOnProfiles" ADD CONSTRAINT "AreasOnProfiles_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AreasOnProfiles" ADD CONSTRAINT "AreasOnProfiles_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
