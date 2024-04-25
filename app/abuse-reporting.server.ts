import { invariantResponse } from "./lib/utils/response";
import { prismaClient } from "./prisma.server";

export async function createProfileAbuseReport(options: {
  reporterId: string;
  username: string;
  reasons: string[];
}) {
  const reporter = await getReporter(options.reporterId);
  await prismaClient.profile.update({
    data: {
      abuseReports: {
        create: {
          title: `Profile "${reporter.username}" reported profile "${options.username}"`,
          reporterId: options.reporterId,
          reasons: {
            createMany: {
              data: options.reasons.map((reason) => {
                return {
                  description: reason,
                };
              }),
            },
          },
        },
      },
    },
    where: {
      username: options.username,
    },
  });
}

export async function createOrganizationAbuseReport(options: {
  reporterId: string;
  slug: string;
  reasons: string[];
}) {
  const reporter = await getReporter(options.reporterId);
  await prismaClient.organization.update({
    data: {
      abuseReports: {
        create: {
          title: `Profile "${reporter.username}" reported organization "${options.slug}"`,
          reporterId: options.reporterId,
          reasons: {
            createMany: {
              data: options.reasons.map((reason) => {
                return {
                  description: reason,
                };
              }),
            },
          },
        },
      },
    },
    where: {
      slug: options.slug,
    },
  });
}

export async function createEventAbuseReport(options: {
  reporterId: string;
  slug: string;
  reasons: string[];
}) {
  const reporter = await getReporter(options.reporterId);
  await prismaClient.event.update({
    data: {
      abuseReports: {
        create: {
          title: `Profile "${reporter.username}" reported event "${options.slug}"`,
          reporterId: options.reporterId,
          reasons: {
            createMany: {
              data: options.reasons.map((reason) => {
                return {
                  description: reason,
                };
              }),
            },
          },
        },
      },
    },
    where: {
      slug: options.slug,
    },
  });
}

export async function createProjectAbuseReport(options: {
  reporterId: string;
  slug: string;
  reasons: string[];
}) {
  const reporter = await getReporter(options.reporterId);
  await prismaClient.project.update({
    data: {
      abuseReports: {
        create: {
          title: `Profile "${reporter.username}" reported project "${options.slug}"`,
          reporterId: options.reporterId,
          reasons: {
            createMany: {
              data: options.reasons.map((reason) => {
                return {
                  description: reason,
                };
              }),
            },
          },
        },
      },
    },
    where: {
      slug: options.slug,
    },
  });
}

async function getReporter(reporterId: string) {
  const reporter = await prismaClient.profile.findUnique({
    select: {
      username: true,
    },
    where: {
      id: reporterId,
    },
  });
  invariantResponse(reporter !== null, "Reporter profile not found", {
    status: 404,
  });
  return reporter;
}

async function sendNewReportMailToSupport(params: any) {
  // TODO: Send mail to support
  // Include:
  // Title
  // Reasons
  // Link to reporter profile
  // Link to reported entity
}
