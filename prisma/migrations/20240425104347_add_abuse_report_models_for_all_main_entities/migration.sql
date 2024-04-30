-- CreateEnum
CREATE TYPE "abuse_report_status" AS ENUM ('open', 'accepted', 'rejected');

-- AlterTable
ALTER TABLE "event_visibilities" ADD COLUMN     "abuseReports" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "organization_visibilities" ADD COLUMN     "abuseReports" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "profile_visibilities" ADD COLUMN     "abuseReports" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "eventAbuseReport" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "organizationAbuseReport" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "profileAbuseReport" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "projectAbuseReport" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "project_visibilities" ADD COLUMN     "abuseReports" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "profile_abuse_reports" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "abuse_report_status" NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "reporter_id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,

    CONSTRAINT "profile_abuse_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_abuse_report_reasons" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "abuse_report_status" NOT NULL DEFAULT 'open',
    "profile_abuse_report_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_abuse_report_reasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_abuse_report_reason_suggestions" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "profile_abuse_report_reason_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_abuse_report_revisions" (
    "id" TEXT NOT NULL,
    "revisor" TEXT NOT NULL,
    "log" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "profileAbuseReportId" TEXT NOT NULL,

    CONSTRAINT "profile_abuse_report_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_abuse_reports" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "abuse_report_status" NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "reporter_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,

    CONSTRAINT "organization_abuse_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_abuse_report_reasons" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "abuse_report_status" NOT NULL DEFAULT 'open',
    "organization_abuse_report_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_abuse_report_reasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_abuse_report_reason_suggestions" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "organization_abuse_report_reason_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_abuse_report_revisions" (
    "id" TEXT NOT NULL,
    "revisor" TEXT NOT NULL,
    "log" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizationAbuseReportId" TEXT NOT NULL,

    CONSTRAINT "organization_abuse_report_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_abuse_reports" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "abuse_report_status" NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "reporter_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,

    CONSTRAINT "event_abuse_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_abuse_report_reasons" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "abuse_report_status" NOT NULL DEFAULT 'open',
    "event_abuse_report_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_abuse_report_reasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_abuse_report_reason_suggestions" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "event_abuse_report_reason_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_abuse_report_revisions" (
    "id" TEXT NOT NULL,
    "revisor" TEXT NOT NULL,
    "log" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventAbuseReportId" TEXT NOT NULL,

    CONSTRAINT "event_abuse_report_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_abuse_reports" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "abuse_report_status" NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "reporter_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,

    CONSTRAINT "project_abuse_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_abuse_report_reasons" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "abuse_report_status" NOT NULL DEFAULT 'open',
    "project_abuse_report_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_abuse_report_reasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_abuse_report_reason_suggestions" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "project_abuse_report_reason_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_abuse_report_revisions" (
    "id" TEXT NOT NULL,
    "revisor" TEXT NOT NULL,
    "log" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectAbuseReportId" TEXT NOT NULL,

    CONSTRAINT "project_abuse_report_revisions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "profile_abuse_reports" ADD CONSTRAINT "profile_abuse_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_abuse_reports" ADD CONSTRAINT "profile_abuse_reports_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_abuse_report_reasons" ADD CONSTRAINT "profile_abuse_report_reasons_profile_abuse_report_id_fkey" FOREIGN KEY ("profile_abuse_report_id") REFERENCES "profile_abuse_reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_abuse_report_revisions" ADD CONSTRAINT "profile_abuse_report_revisions_profileAbuseReportId_fkey" FOREIGN KEY ("profileAbuseReportId") REFERENCES "profile_abuse_reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_abuse_reports" ADD CONSTRAINT "organization_abuse_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_abuse_reports" ADD CONSTRAINT "organization_abuse_reports_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_abuse_report_reasons" ADD CONSTRAINT "organization_abuse_report_reasons_organization_abuse_repor_fkey" FOREIGN KEY ("organization_abuse_report_id") REFERENCES "organization_abuse_reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_abuse_report_revisions" ADD CONSTRAINT "organization_abuse_report_revisions_organizationAbuseRepor_fkey" FOREIGN KEY ("organizationAbuseReportId") REFERENCES "organization_abuse_reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_abuse_reports" ADD CONSTRAINT "event_abuse_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_abuse_reports" ADD CONSTRAINT "event_abuse_reports_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_abuse_report_reasons" ADD CONSTRAINT "event_abuse_report_reasons_event_abuse_report_id_fkey" FOREIGN KEY ("event_abuse_report_id") REFERENCES "event_abuse_reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_abuse_report_revisions" ADD CONSTRAINT "event_abuse_report_revisions_eventAbuseReportId_fkey" FOREIGN KEY ("eventAbuseReportId") REFERENCES "event_abuse_reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_abuse_reports" ADD CONSTRAINT "project_abuse_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_abuse_reports" ADD CONSTRAINT "project_abuse_reports_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_abuse_report_reasons" ADD CONSTRAINT "project_abuse_report_reasons_project_abuse_report_id_fkey" FOREIGN KEY ("project_abuse_report_id") REFERENCES "project_abuse_reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_abuse_report_revisions" ADD CONSTRAINT "project_abuse_report_revisions_projectAbuseReportId_fkey" FOREIGN KEY ("projectAbuseReportId") REFERENCES "project_abuse_reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
