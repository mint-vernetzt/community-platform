import { invariantResponse } from "./lib/utils/response";
import { prismaClient } from "./prisma.server";

export async function createAbuseReportRequest(report: {
  entity: {
    type: "profile" | "organization" | "event" | "project";
    slug: string;
  };
  reporter: {
    id: string;
    email: string;
  };
  reasons: string[];
}) {
  const reportJSON = JSON.stringify({
    report: {
      ...report,
      reporter: { email: report.reporter.email },
    },
    origin: process.env.COMMUNITY_BASE_URL,
  });
  const response = await fetch(process.env.ABUSE_REPORT_URL, {
    method: "POST", // *GET, POST, PUT, DELETE, etc.
    mode: "same-origin", // no-cors, *cors, same-origin
    cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
    headers: {
      "Content-Type": "application/json",
    },
    body: reportJSON, // body data type must match "Content-Type" header
  });
  if (response.status === 200) {
    let data;
    // These if cases are necessary to avoid union type issue of prisma. prismaClient[report.entity.type].findUnique(...) is not working without type issues.
    if (report.entity.type === "profile") {
      const reportedProfile = await prismaClient.profile.findUnique({
        select: {
          id: true,
        },
        where: {
          username: report.entity.slug,
        },
      });
      invariantResponse(
        reportedProfile !== null,
        "Reported profile not found",
        { status: 404 }
      );
      data = await prismaClient.profile.update({
        select: {
          id: true,
          username: true,
          profileAbuseReportRequests: {
            where: {
              report: reportJSON,
            },
          },
        },
        data: {
          profileAbuseReportRequests: {
            create: {
              report: reportJSON,
              profileId: reportedProfile.id,
            },
          },
        },
        where: {
          id: report.reporter.id,
        },
      });
    }
    if (report.entity.type === "organization") {
      const reportedOrganization = await prismaClient.organization.findUnique({
        select: {
          id: true,
        },
        where: {
          slug: report.entity.slug,
        },
      });
      invariantResponse(
        reportedOrganization !== null,
        "Reported organization not found",
        { status: 404 }
      );
      data = await prismaClient.profile.update({
        select: {
          id: true,
          username: true,
          organizationAbuseReportRequests: {
            where: {
              report: reportJSON,
            },
          },
        },
        data: {
          organizationAbuseReportRequests: {
            create: {
              report: reportJSON,
              organizationId: reportedOrganization.id,
            },
          },
        },
        where: {
          id: report.reporter.id,
        },
      });
    }
    if (report.entity.type === "event") {
      const reportedEvent = await prismaClient.event.findUnique({
        select: {
          id: true,
        },
        where: {
          slug: report.entity.slug,
        },
      });
      invariantResponse(reportedEvent !== null, "Reported event not found", {
        status: 404,
      });
      data = await prismaClient.profile.update({
        select: {
          id: true,
          username: true,
          eventAbuseReportRequests: {
            where: {
              report: reportJSON,
            },
          },
        },
        data: {
          eventAbuseReportRequests: {
            create: {
              report: reportJSON,
              eventId: reportedEvent.id,
            },
          },
        },
        where: {
          id: report.reporter.id,
        },
      });
    }
    if (report.entity.type === "project") {
      const reportedProject = await prismaClient.project.findUnique({
        select: {
          id: true,
        },
        where: {
          slug: report.entity.slug,
        },
      });
      invariantResponse(
        reportedProject !== null,
        "Reported project not found",
        { status: 404 }
      );
      data = await prismaClient.profile.update({
        select: {
          id: true,
          username: true,
          projectAbuseReportRequests: {
            where: {
              report: reportJSON,
            },
          },
        },
        data: {
          projectAbuseReportRequests: {
            create: {
              report: reportJSON,
              projectId: reportedProject.id,
            },
          },
        },
        where: {
          id: report.reporter.id,
        },
      });
    }
    return { error: null, data };
  }
  return {
    error: {
      message: "Unsuccesful fetch",
      response,
    },
    data: null,
  };
}
