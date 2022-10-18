-- AlterTable
ALTER TABLE "events" ADD COLUMN     "canceled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stage_id" TEXT,
ADD COLUMN     "subline" TEXT;

-- CreateTable
CREATE TABLE "stages" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "stages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stages_title_key" ON "stages"("title");

-- CreateIndex
CREATE UNIQUE INDEX "stages_slug_key" ON "stages"("slug");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
