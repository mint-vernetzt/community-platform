-- CreateTable
CREATE TABLE "profile_visibilities" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "email" BOOLEAN NOT NULL DEFAULT false,
    "position" BOOLEAN NOT NULL DEFAULT false,
    "phone" BOOLEAN NOT NULL DEFAULT false,
    "bio" BOOLEAN NOT NULL DEFAULT false,
    "skills" BOOLEAN NOT NULL DEFAULT false,
    "interests" BOOLEAN NOT NULL DEFAULT false,
    "seekings" BOOLEAN NOT NULL DEFAULT false,
    "offers" BOOLEAN NOT NULL DEFAULT false,
    "website" BOOLEAN NOT NULL DEFAULT false,
    "facebook" BOOLEAN NOT NULL DEFAULT false,
    "linkedin" BOOLEAN NOT NULL DEFAULT false,
    "twitter" BOOLEAN NOT NULL DEFAULT false,
    "youtube" BOOLEAN NOT NULL DEFAULT false,
    "instagram" BOOLEAN NOT NULL DEFAULT false,
    "xing" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "profile_visibilities_pkey" PRIMARY KEY ("id")
);
