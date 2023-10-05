-- AlterTable
ALTER TABLE "profile_visibilities" ADD COLUMN     "notfication_settings" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "notification_settings" (
    "id" TEXT NOT NULL,
    "updates" BOOLEAN NOT NULL DEFAULT true,
    "profileId" TEXT NOT NULL,

    CONSTRAINT "notification_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notification_settings_profileId_key" ON "notification_settings"("profileId");

-- AddForeignKey
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
