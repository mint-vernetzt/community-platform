-- CreateEnum
CREATE TYPE "area_types" AS ENUM ('country', 'state', 'district');

-- CreateTable
CREATE TABLE "areas" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "area_types" NOT NULL,
    "stateId" TEXT,

    CONSTRAINT "areas_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "areas" ADD CONSTRAINT "areas_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State"("agsPrefix") ON DELETE SET NULL ON UPDATE CASCADE;
