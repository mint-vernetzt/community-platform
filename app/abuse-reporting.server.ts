import { invariantResponse } from "./lib/utils/response";
import {
  getCompiledMailTemplate,
  mailer,
  mailerOptions,
} from "./mailer.server";
import { prismaClient } from "./prisma.server";

export async function createProfileAbuseReport(options: {
  reporterId: string;
  username: string;
  reasons: string[];
}) {
  const reporter = await getReporter(options.reporterId);
  const title = `Profile "${reporter.username}" reported profile "${options.username}"`;
  await prismaClient.profile.update({
    data: {
      abuseReports: {
        create: {
          title: title,
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

  return {
    title,
    entityUrl: `${process.env.COMMUNITY_BASE_URL}/profile/${options.username}`,
    reporter: {
      email: reporter.email,
      url: `${process.env.COMMUNITY_BASE_URL}/profile/${reporter.username}`,
    },
    reasons: options.reasons,
  };
}

export async function createOrganizationAbuseReport(options: {
  reporterId: string;
  slug: string;
  reasons: string[];
}) {
  const reporter = await getReporter(options.reporterId);
  const title = `Profile "${reporter.username}" reported organization "${options.slug}"`;
  await prismaClient.organization.update({
    data: {
      abuseReports: {
        create: {
          title: title,
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
  return {
    title,
    entityUrl: `${process.env.COMMUNITY_BASE_URL}/organization/${options.slug}`,
    reporter: {
      email: reporter.email,
      url: `${process.env.COMMUNITY_BASE_URL}/profile/${reporter.username}`,
    },
    reasons: options.reasons,
  };
}

export async function createEventAbuseReport(options: {
  reporterId: string;
  slug: string;
  reasons: string[];
}) {
  const reporter = await getReporter(options.reporterId);
  const title = `Profile "${reporter.username}" reported event "${options.slug}"`;
  await prismaClient.event.update({
    data: {
      abuseReports: {
        create: {
          title: title,
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
  return {
    title,
    entityUrl: `${process.env.COMMUNITY_BASE_URL}/event/${options.slug}`,
    reporter: {
      email: reporter.email,
      url: `${process.env.COMMUNITY_BASE_URL}/profile/${reporter.username}`,
    },
    reasons: options.reasons,
  };
}

export async function createProjectAbuseReport(options: {
  reporterId: string;
  slug: string;
  reasons: string[];
}) {
  const reporter = await getReporter(options.reporterId);
  const title = `Profile "${reporter.username}" reported project "${options.slug}"`;
  await prismaClient.project.update({
    data: {
      abuseReports: {
        create: {
          title: title,
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
  return {
    title,
    entityUrl: `${process.env.COMMUNITY_BASE_URL}/project/${options.slug}`,
    reporter: {
      email: reporter.email,
      url: `${process.env.COMMUNITY_BASE_URL}/profile/${reporter.username}`,
    },
    reasons: options.reasons,
  };
}

async function getReporter(reporterId: string) {
  const reporter = await prismaClient.profile.findUnique({
    select: {
      username: true,
      email: true,
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

export async function sendNewReportMailToSupport(report: {
  title: string;
  reporter: {
    url: string;
    email: string;
  };
  entityUrl: string;
  reasons: string[];
}) {
  const sender = process.env.SYSTEM_MAIL_SENDER;
  const recipient = process.env.SUPPORT_MAIL;
  const { title, ...rest } = report;
  const subject = title;
  const content = rest;
  const textTemplatePath = "mail-templates/abuse-report-support/text.hbs";
  const text = getCompiledMailTemplate<typeof textTemplatePath>(
    textTemplatePath,
    content,
    "text"
  );
  const htmlTemplatePath = "mail-templates/abuse-report-support/html.hbs";
  const html = getCompiledMailTemplate<typeof htmlTemplatePath>(
    htmlTemplatePath,
    content,
    "html"
  );

  try {
    await mailer(mailerOptions, sender, recipient, subject, text, html);
  } catch (error) {
    // Throw a 500 -> Mailer issue
    console.error({ error });
    invariantResponse(false, "Server error", { status: 500 });
  }
}
