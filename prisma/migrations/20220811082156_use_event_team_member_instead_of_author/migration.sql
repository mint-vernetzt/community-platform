/*
  Warnings:

  - You are about to drop the column `author_id` on the `events` table. All the data in the column will be lost.
  - You are about to drop the `organizing_organizations_of_events` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `organizing_profiles_of_events` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "events" DROP CONSTRAINT "events_author_id_fkey";

-- DropForeignKey
ALTER TABLE "events" DROP CONSTRAINT "events_experience_level_id_fkey";

-- DropForeignKey
ALTER TABLE "organizing_organizations_of_events" DROP CONSTRAINT "organizing_organizations_of_events_event_id_fkey";

-- DropForeignKey
ALTER TABLE "organizing_organizations_of_events" DROP CONSTRAINT "organizing_organizations_of_events_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "organizing_profiles_of_events" DROP CONSTRAINT "organizing_profiles_of_events_event_id_fkey";

-- DropForeignKey
ALTER TABLE "organizing_profiles_of_events" DROP CONSTRAINT "organizing_profiles_of_events_profile_id_fkey";

-- AlterTable
ALTER TABLE "events" DROP COLUMN "author_id";

-- DropTable
DROP TABLE "organizing_organizations_of_events";

-- DropTable
DROP TABLE "organizing_profiles_of_events";

-- CreateTable
CREATE TABLE "team_members_of_events" (
    "event_id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "isPrivileged" BOOLEAN NOT NULL DEFAULT false,
    "responsibileFor" TEXT,

    CONSTRAINT "team_members_of_events_pkey" PRIMARY KEY ("event_id","profile_id")
);

-- CreateTable
CREATE TABLE "responsible_organizations_of_events" (
    "event_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,

    CONSTRAINT "responsible_organizations_of_events_pkey" PRIMARY KEY ("event_id","organization_id")
);

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_experience_level_id_fkey" FOREIGN KEY ("experience_level_id") REFERENCES "experience_levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members_of_events" ADD CONSTRAINT "team_members_of_events_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members_of_events" ADD CONSTRAINT "team_members_of_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responsible_organizations_of_events" ADD CONSTRAINT "responsible_organizations_of_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responsible_organizations_of_events" ADD CONSTRAINT "responsible_organizations_of_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
