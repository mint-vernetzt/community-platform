import type { User } from "@supabase/supabase-js";
import * as authServerModule from "~/auth.server";
import { createRequestWithFormData } from "~/lib/utils/tests";
import { prismaClient } from "~/prisma.server";
import { action } from "./move-to-participants";

// @ts-ignore
const expect = global.expect as jest.Expect;

const getSessionUserOrThrow = jest.spyOn(
  authServerModule,
  "getSessionUserOrThrow"
);

jest.mock("~/prisma.server", () => {
  return {
    prismaClient: {
      event: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
      participantOfEvent: {
        create: jest.fn(),
      },
      waitingParticipantOfEvent: {
        delete: jest.fn(),
      },
      profile: {
        findUnique: jest.fn(),
      },
    },
  };
});

jest.mock("~/lib/utils/application", () => {
  return {
    checkFeatureAbilitiesOrThrow: jest.fn(),
  };
});

jest.mock("~/mailer.server", () => {
  return {
    ...jest.requireActual("~/mailer.server"),
    mailer: jest.fn(),
  };
});

describe("/event/$slug/settings/waiting-list/move-to-participants", () => {
  beforeEach(() => {
    process.env.SYSTEM_MAIL_SENDER = "system@mail.org";
    process.env.COMMUNITY_BASE_URL = "http://localhost:3000";
  });

  test("anon user", async () => {
    const request = createRequestWithFormData({});

    expect.assertions(2);

    try {
      await action({
        request,
        context: {},
        params: { slug: "some-event-slug" },
      });
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json.message).toBe("No session or session user found");
    }
  });

  test("authenticated but not admin user", async () => {
    const request = createRequestWithFormData({});

    expect.assertions(1);

    getSessionUserOrThrow.mockResolvedValueOnce({ id: "some-user-id" } as User);

    (prismaClient.event.findFirst as jest.Mock).mockResolvedValueOnce(null);

    try {
      await action({
        request,
        context: {},
        params: { slug: "some-event-slug" },
      });
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(403);
    }
  });

  test("event not found", async () => {
    expect.assertions(1);

    const request = createRequestWithFormData({
      profileId: "some-user-id",
    });

    getSessionUserOrThrow.mockResolvedValueOnce({ id: "some-user-id" } as User);

    (prismaClient.event.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-event-id",
    });

    (prismaClient.event.findUnique as jest.Mock).mockResolvedValueOnce(null);

    try {
      await action({
        request,
        context: {},
        params: { slug: "some-event-slug" },
      });
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(404);
    }
  });

  test("profile not found", async () => {
    expect.assertions(1);

    const request = createRequestWithFormData({
      profileId: "some-user-id",
    });

    getSessionUserOrThrow.mockResolvedValueOnce({ id: "some-user-id" } as User);

    (prismaClient.event.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-event-id",
    });

    (prismaClient.event.findUnique as jest.Mock).mockResolvedValueOnce({
      id: "some-event-id",
    });

    (prismaClient.profile.findUnique as jest.Mock).mockResolvedValueOnce(null);

    try {
      await action({
        request,
        context: {},
        params: { slug: "some-event-slug" },
      });
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(404);
    }
  });

  test("SYSTEM_MAIL_SENDER not defined in .env", async () => {
    delete process.env.SYSTEM_MAIL_SENDER;
    expect.assertions(1);

    const request = createRequestWithFormData({
      profileId: "another-user-id",
    });

    getSessionUserOrThrow.mockResolvedValueOnce({ id: "some-user-id" } as User);

    (prismaClient.event.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-event-id",
    });

    (prismaClient.event.findUnique as jest.Mock).mockResolvedValueOnce({
      id: "some-event-id",
    });

    (prismaClient.profile.findUnique as jest.Mock).mockResolvedValueOnce({
      id: "another-user-id",
    });

    try {
      await action({
        request,
        context: {},
        params: { slug: "some-event-slug" },
      });
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(400);
    }
  });

  test("COMMUNITY_BASE_URL not defined in .env", async () => {
    delete process.env.COMMUNITY_BASE_URL;
    expect.assertions(1);

    const request = createRequestWithFormData({
      profileId: "another-user-id",
    });

    getSessionUserOrThrow.mockResolvedValueOnce({ id: "some-user-id" } as User);

    (prismaClient.event.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-event-id",
    });

    (prismaClient.event.findUnique as jest.Mock).mockResolvedValueOnce({
      id: "some-event-id",
    });

    (prismaClient.profile.findUnique as jest.Mock).mockResolvedValueOnce({
      id: "another-user-id",
    });

    try {
      await action({
        request,
        context: {},
        params: { slug: "some-event-slug" },
      });
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(400);
    }
  });

  test("move profile from waiting list to participants", async () => {
    expect.assertions(3);

    const request = createRequestWithFormData({
      profileId: "another-user-id",
    });

    getSessionUserOrThrow.mockResolvedValueOnce({ id: "some-user-id" } as User);

    (prismaClient.event.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-event-id",
    });

    (prismaClient.event.findUnique as jest.Mock).mockResolvedValueOnce({
      id: "some-event-id",
      name: "some-event-name",
      slug: "some-event-slug",
      startTime: new Date("2023-06-06T13:05:00Z"),
      admins: [
        {
          profile: {
            firstName: "some-admin-firstname",
            lastName: "some-admin-lastname",
            email: "admin@email.org",
          },
        },
      ],
    });

    (prismaClient.profile.findUnique as jest.Mock).mockResolvedValueOnce({
      id: "another-user-id",
      email: "another@user.org",
      firstName: "another-user-firstname",
      lastName: "another-user-lastname",
    });

    const response = await action({
      request,
      context: {},
      params: { slug: "some-event-slug" },
    });
    const responseBody = await response.json();
    expect(
      prismaClient.waitingParticipantOfEvent.delete
    ).toHaveBeenLastCalledWith({
      where: {
        profileId_eventId: {
          eventId: "some-event-id",
          profileId: "another-user-id",
        },
      },
    });
    expect(prismaClient.participantOfEvent.create).toHaveBeenLastCalledWith({
      data: {
        eventId: "some-event-id",
        profileId: "another-user-id",
      },
    });
    expect(responseBody.success).toBe(true);
  });

  afterEach(() => {
    delete process.env.SYSTEM_MAIL_SENDER;
    delete process.env.COMMUNITY_BASE_URL;
  });
});
