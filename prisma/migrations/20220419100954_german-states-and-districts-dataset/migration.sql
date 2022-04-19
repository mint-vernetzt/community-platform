-- CreateTable
CREATE TABLE "State" (
    "agsPrefix" TEXT NOT NULL,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "District" (
    "ags" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stateAgsPrefix" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "State_agsPrefix_key" ON "State"("agsPrefix");

-- CreateIndex
CREATE UNIQUE INDEX "State_name_key" ON "State"("name");

-- CreateIndex
CREATE UNIQUE INDEX "District_ags_key" ON "District"("ags");

-- CreateIndex
CREATE UNIQUE INDEX "District_name_stateAgsPrefix_key" ON "District"("name", "stateAgsPrefix");

-- AddForeignKey
ALTER TABLE "District" ADD CONSTRAINT "District_stateAgsPrefix_fkey" FOREIGN KEY ("stateAgsPrefix") REFERENCES "State"("agsPrefix") ON DELETE RESTRICT ON UPDATE CASCADE;
