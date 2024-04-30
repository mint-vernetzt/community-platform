/**
 * @vitest-environment jsdom
 */
import { type Profile } from "@prisma/client";
import { beforeAll, expect, test, vi } from "vitest";
import { prismaClient } from "~/__mocks__/prisma.server";
import {
  createEventAbuseReport,
  createOrganizationAbuseReport,
  createProfileAbuseReport,
  createProjectAbuseReport,
  sendNewReportMailToSupport,
} from "./abuse-reporting.server";
import { mailerOptions } from "./lib/submissions/mailer/mailerOptions";
import { testURL } from "./lib/utils/tests";
import { getCompiledMailTemplate, mailer } from "./mailer.server";

vi.mock("~/prisma.server");

beforeAll(() => {
  process.env.COMMUNITY_BASE_URL = testURL;
  process.env.SYSTEM_MAIL_SENDER = "some@sender.org";
  process.env.SUPPORT_MAIL = "some@support.org";
});

test("Reporter profile not found", async () => {
  prismaClient.profile.findUnique.mockResolvedValue(null);

  let response;
  try {
    await createProfileAbuseReport({
      reporterId: "some-reporter-id",
      username: "some-reported-profile-username",
      reasons: ["Some reason", "Another reason"],
    });
  } catch (error) {
    if (error instanceof Response) {
      response = error;
    }
  }

  expect(response?.status).toBe(404);
});

test("Create profile abuse report", async () => {
  prismaClient.profile.findUnique.mockResolvedValue({
    username: "some-reporter-username",
    email: "reporter@mail.org",
  } as Profile);

  const report = await createProfileAbuseReport({
    reporterId: "some-reporter-id",
    username: "some-reported-profile-username",
    reasons: ["Some reason", "Another reason"],
  });

  expect(prismaClient.profile.update).toHaveBeenCalledWith({
    data: {
      abuseReports: {
        create: {
          title:
            'Profile "some-reporter-username" reported profile "some-reported-profile-username"',
          reporterId: "some-reporter-id",
          reasons: {
            createMany: {
              data: [
                {
                  description: "Some reason",
                },
                {
                  description: "Another reason",
                },
              ],
            },
          },
        },
      },
    },
    where: {
      username: "some-reported-profile-username",
    },
  });

  expect(report).toStrictEqual({
    title:
      'Profile "some-reporter-username" reported profile "some-reported-profile-username"',
    entityUrl: `${testURL}/profile/some-reported-profile-username`,
    reporter: {
      email: "reporter@mail.org",
      url: `${testURL}/profile/some-reporter-username`,
    },
    reasons: ["Some reason", "Another reason"],
  });
});

test("Create organization abuse report", async () => {
  prismaClient.profile.findUnique.mockResolvedValue({
    username: "some-reporter-username",
    email: "reporter@mail.org",
  } as Profile);

  const report = await createOrganizationAbuseReport({
    reporterId: "some-reporter-id",
    slug: "some-reported-organization-slug",
    reasons: ["Some reason", "Another reason"],
  });

  expect(prismaClient.organization.update).toHaveBeenCalledWith({
    data: {
      abuseReports: {
        create: {
          title:
            'Profile "some-reporter-username" reported organization "some-reported-organization-slug"',
          reporterId: "some-reporter-id",
          reasons: {
            createMany: {
              data: [
                {
                  description: "Some reason",
                },
                {
                  description: "Another reason",
                },
              ],
            },
          },
        },
      },
    },
    where: {
      slug: "some-reported-organization-slug",
    },
  });

  expect(report).toStrictEqual({
    title:
      'Profile "some-reporter-username" reported organization "some-reported-organization-slug"',
    entityUrl: `${testURL}/organization/some-reported-organization-slug`,
    reporter: {
      email: "reporter@mail.org",
      url: `${testURL}/profile/some-reporter-username`,
    },
    reasons: ["Some reason", "Another reason"],
  });
});

test("Create event abuse report", async () => {
  prismaClient.profile.findUnique.mockResolvedValue({
    username: "some-reporter-username",
    email: "reporter@mail.org",
  } as Profile);

  const report = await createEventAbuseReport({
    reporterId: "some-reporter-id",
    slug: "some-reported-event-slug",
    reasons: ["Some reason", "Another reason"],
  });

  expect(prismaClient.event.update).toHaveBeenCalledWith({
    data: {
      abuseReports: {
        create: {
          title:
            'Profile "some-reporter-username" reported event "some-reported-event-slug"',
          reporterId: "some-reporter-id",
          reasons: {
            createMany: {
              data: [
                {
                  description: "Some reason",
                },
                {
                  description: "Another reason",
                },
              ],
            },
          },
        },
      },
    },
    where: {
      slug: "some-reported-event-slug",
    },
  });

  expect(report).toStrictEqual({
    title:
      'Profile "some-reporter-username" reported event "some-reported-event-slug"',
    entityUrl: `${testURL}/event/some-reported-event-slug`,
    reporter: {
      email: "reporter@mail.org",
      url: `${testURL}/profile/some-reporter-username`,
    },
    reasons: ["Some reason", "Another reason"],
  });
});

test("Create project abuse report", async () => {
  prismaClient.profile.findUnique.mockResolvedValue({
    username: "some-reporter-username",
    email: "reporter@mail.org",
  } as Profile);

  const report = await createProjectAbuseReport({
    reporterId: "some-reporter-id",
    slug: "some-reported-project-slug",
    reasons: ["Some reason", "Another reason"],
  });

  expect(prismaClient.project.update).toHaveBeenCalledWith({
    data: {
      abuseReports: {
        create: {
          title:
            'Profile "some-reporter-username" reported project "some-reported-project-slug"',
          reporterId: "some-reporter-id",
          reasons: {
            createMany: {
              data: [
                {
                  description: "Some reason",
                },
                {
                  description: "Another reason",
                },
              ],
            },
          },
        },
      },
    },
    where: {
      slug: "some-reported-project-slug",
    },
  });

  expect(report).toStrictEqual({
    title:
      'Profile "some-reporter-username" reported project "some-reported-project-slug"',
    entityUrl: `${testURL}/project/some-reported-project-slug`,
    reporter: {
      email: "reporter@mail.org",
      url: `${testURL}/profile/some-reporter-username`,
    },
    reasons: ["Some reason", "Another reason"],
  });
});

test("Prepare new report mail to support", async () => {
  vi.mock("~/mailer.server.ts");

  await sendNewReportMailToSupport({
    title:
      'Profile "some-reporter-username" reported project "some-reported-project-slug"',
    entityUrl: `${testURL}/project/some-reported-project-slug`,
    reporter: {
      email: "reporter@mail.org",
      url: `${testURL}/profile/some-reporter-username`,
    },
    reasons: ["Some reason", "Another reason"],
  });

  expect(getCompiledMailTemplate).toHaveBeenCalledWith(
    "mail-templates/abuse-report-support/text.hbs",
    {
      entityUrl: `${testURL}/project/some-reported-project-slug`,
      reporter: {
        email: "reporter@mail.org",
        url: `${testURL}/profile/some-reporter-username`,
      },
      reasons: ["Some reason", "Another reason"],
    },
    "text"
  );
  expect(getCompiledMailTemplate).toHaveBeenCalledWith(
    "mail-templates/abuse-report-support/html.hbs",
    {
      entityUrl: `${testURL}/project/some-reported-project-slug`,
      reporter: {
        email: "reporter@mail.org",
        url: `${testURL}/profile/some-reporter-username`,
      },
      reasons: ["Some reason", "Another reason"],
    },
    "html"
  );
  expect(mailer).toHaveBeenCalledWith(
    mailerOptions,
    "some@sender.org",
    "some@support.org",
    'Profile "some-reporter-username" reported project "some-reported-project-slug"',
    undefined,
    undefined
  );
});
