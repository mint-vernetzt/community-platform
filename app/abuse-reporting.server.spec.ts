/**
 * @vitest-environment jsdom
 */
import { type Profile } from "@prisma/client";
import { beforeAll, expect, test, vi } from "vitest";
import { prismaClient } from "~/__mocks__/prisma.server";
import { createProfileAbuseReport } from "./abuse-reporting.server";
import { testURL } from "./lib/utils/tests";

vi.mock("~/prisma.server");

beforeAll(() => {
  process.env.COMMUNITY_BASE_URL = testURL;
  process.env.SYSTEM_MAIL_SENDER = "some@sender.org";
  process.env.SUPPORT_MAIL = "some@support.org";
  // process.env.MAILER_HOST = "8.8.8.8";
  // process.env.MAILER_PORT = "1234";
  // process.env.MAILER_USER = "some-mailer-user";
  // process.env.MAILER_PASS = "some-mailer-pass";
});

// TODO: Test reporter profile not found

// TODO: Test email could not be sent (mailer returns error)

test("Create profile abuse report", async () => {
  prismaClient.profile.findUnique.mockResolvedValue({
    username: "some-reporter-username",
    email: "reporter@mail.org",
  } as Profile);

  await createProfileAbuseReport({
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
  // TODO: Mock mailer
});
