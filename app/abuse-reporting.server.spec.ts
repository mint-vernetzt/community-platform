/**
 * @vitest-environment jsdom
 */
import {
  type Event,
  type EventAbuseReportRequest,
  type Profile,
} from "@prisma/client";
import { beforeAll, expect, test, vi } from "vitest";
import { prismaClient } from "~/__mocks__/prisma.server";
import { createAbuseReportRequest } from "./abuse-reporting.server";
import { abuseReportTestUrl, testURL } from "./lib/utils/tests";

vi.mock("~/prisma.server");

beforeAll(() => {
  process.env.ABUSE_REPORT_URL = abuseReportTestUrl;
  process.env.COMMUNITY_BASE_URL = testURL;
});

test("Send valid abuse report request", async () => {
  prismaClient.event.findUnique.mockResolvedValue({
    id: "some-reported-event-id",
  } as Event);
  prismaClient.profile.update.mockResolvedValue({
    id: "some-reporter-id",
    username: "some-reporter-username",
    eventAbuseReportRequests: [
      {
        id: "some-report-id",
        report: "report as JSON string",
        reporterId: "some-reporter-id",
        eventId: "some-reported-event-id",
      },
      {
        id: "another-report-id",
        report: "another report as JSON string",
        reporterId: "some-reporter-id",
        eventId: "another-reported-event-id",
      },
    ],
  } as Profile & { eventAbuseReportRequests: EventAbuseReportRequest[] });

  const { data, error } = await createAbuseReportRequest({
    entity: {
      slug: "some-slug",
      type: "event",
    },
    reporter: {
      email: "some@reporter.com",
      id: "some-reporter-id",
    },
    reasons: ["Reason 1", "Reason 2"],
  });

  expect(error).toBe(null);
  expect(data).toStrictEqual({
    id: "some-reporter-id",
    username: "some-reporter-username",
    eventAbuseReportRequests: [
      {
        id: "some-report-id",
        report: "report as JSON string",
        reporterId: "some-reporter-id",
        eventId: "some-reported-event-id",
      },
      {
        id: "another-report-id",
        report: "another report as JSON string",
        reporterId: "some-reporter-id",
        eventId: "another-reported-event-id",
      },
    ],
  });
});

test("Send invalid report", async () => {
  const { data, error } = await createAbuseReportRequest({
    entity: {
      slug: "some-slug",
      type: "event",
    },
    reporter: {
      email: "<not-an-email>",
      id: "some-reporter-id",
    },
    reasons: ["Reason 1", "Reason 2"],
  });

  expect(data).toBe(null);
  expect(error?.message).toEqual("Unsuccesful fetch");
  expect(error?.response.status).toEqual(400);
});
