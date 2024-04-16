-- AlterTable
ALTER TABLE "event_visibilities" ADD COLUMN     "abuseReports" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "organization_visibilities" ADD COLUMN     "abuseReports" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "profile_visibilities" ADD COLUMN     "abuseReports" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "eventAbuseReportRequests" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "organizationAbuseReportRequests" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "profileAbuseReportRequests" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "projectAbuseReportRequests" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "project_visibilities" ADD COLUMN     "abuseReports" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ProfileAbuseReportRequest" (
    "id" TEXT NOT NULL,
    "report" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,

    CONSTRAINT "ProfileAbuseReportRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationAbuseReportRequest" (
    "id" TEXT NOT NULL,
    "report" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "OrganizationAbuseReportRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventAbuseReportRequest" (
    "id" TEXT NOT NULL,
    "report" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,

    CONSTRAINT "EventAbuseReportRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectAbuseReportRequest" (
    "id" TEXT NOT NULL,
    "report" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "ProjectAbuseReportRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProfileAbuseReportRequest" ADD CONSTRAINT "ProfileAbuseReportRequest_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileAbuseReportRequest" ADD CONSTRAINT "ProfileAbuseReportRequest_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationAbuseReportRequest" ADD CONSTRAINT "OrganizationAbuseReportRequest_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationAbuseReportRequest" ADD CONSTRAINT "OrganizationAbuseReportRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventAbuseReportRequest" ADD CONSTRAINT "EventAbuseReportRequest_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventAbuseReportRequest" ADD CONSTRAINT "EventAbuseReportRequest_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectAbuseReportRequest" ADD CONSTRAINT "ProjectAbuseReportRequest_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectAbuseReportRequest" ADD CONSTRAINT "ProjectAbuseReportRequest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
