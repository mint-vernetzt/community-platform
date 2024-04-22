/**
 * @vitest-environment jsdom
 */
import { beforeAll, expect, test, vi } from "vitest";
import { createAbuseReportRequest } from "./abuse-reporting.server";
import { abuseReportTestUrl } from "./lib/utils/tests";
import { prismaClient } from "~/__mocks__/prisma.server";
import {
  type EventAbuseReportRequest,
  type Event,
  type Profile,
} from "@prisma/client";
import { server } from "./../tests/mocks";
import { http } from "msw";

vi.mock("~/prisma.server");

beforeAll(() => {
  process.env.ABUSE_REPORT_URL = abuseReportTestUrl;
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

test("Handle error response from report tool", async () => {
  server.use(
    http.post(abuseReportTestUrl, async () => {
      return new Response("error", { status: 403 });
    })
  );
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

  expect(data).toBe(null);
  expect(error?.message).toEqual("Unsuccesful fetch");
  expect(error?.response.status).toEqual(403);
});
