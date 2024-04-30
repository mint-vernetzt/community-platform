/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `event_abuse_report_reason_suggestions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `organization_abuse_report_reason_suggestions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `profile_abuse_report_reason_suggestions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `project_abuse_report_reason_suggestions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `event_abuse_report_reason_suggestions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `organization_abuse_report_reason_suggestions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `profile_abuse_report_reason_suggestions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `project_abuse_report_reason_suggestions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "event_abuse_report_reason_suggestions" ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "organization_abuse_report_reason_suggestions" ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "profile_abuse_report_reason_suggestions" ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "project_abuse_report_reason_suggestions" ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "event_abuse_report_reason_suggestions_slug_key" ON "event_abuse_report_reason_suggestions"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "organization_abuse_report_reason_suggestions_slug_key" ON "organization_abuse_report_reason_suggestions"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "profile_abuse_report_reason_suggestions_slug_key" ON "profile_abuse_report_reason_suggestions"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "project_abuse_report_reason_suggestions_slug_key" ON "project_abuse_report_reason_suggestions"("slug");
