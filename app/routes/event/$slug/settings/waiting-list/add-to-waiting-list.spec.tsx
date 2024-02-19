import type { User } from "@supabase/supabase-js";
import * as authServerModule from "~/auth.server";
import { createRequestWithFormData } from "~/lib/utils/tests";
import { prismaClient } from "~/prisma.server";
import { action } from "./add-to-waiting-list";

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
      waitingParticipantOfEvent: {
        create: jest.fn(),
      },
      profile: {
        findFirst: jest.fn(),
      },
    },
  };
});

jest.mock("~/lib/utils/application", () => {
  return {
    checkFeatureAbilitiesOrThrow: jest.fn(),
  };
});

describe("/event/$slug/settings/waiting-list/add-to-waiting-list", () => {
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

  test("authenticated but not admin user can not add another user as participant", async () => {
    const request = createRequestWithFormData({
      profileId: "another-user-id",
    });

    expect.assertions(1);

    getSessionUserOrThrow.mockResolvedValueOnce({ id: "some-user-id" } as User);

    (prismaClient.profile.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "another-user-id",
      participatedEvents: [],
      waitingForEvents: [],
    });

    (prismaClient.event.findUnique as jest.Mock).mockResolvedValueOnce({
      id: "some-event-id",
    });

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

  test("profile not found", async () => {
    const request = createRequestWithFormData({
      profileId: "some-user-id",
    });

    expect.assertions(4);

    getSessionUserOrThrow.mockResolvedValueOnce({ id: "some-user-id" } as User);

    (prismaClient.event.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-event-id",
    });

    (prismaClient.profile.findFirst as jest.Mock).mockResolvedValueOnce(null);

    const response = await action({
      request,
      context: {},
      params: { slug: "some-event-slug" },
    });
    const responseBody = await response.json();
    expect(responseBody.success).toBe(false);
    // TODO: fix type issues
    // @ts-ignore
    expect(responseBody.errors).toBeDefined();
    // @ts-ignore
    expect(responseBody.errors).not.toBeNull();
    // @ts-ignore
    expect(responseBody.errors.profileId).toStrictEqual([
      "error.inputError.notFound",
    ]);
  });

  test("already on waiting list", async () => {
    expect.assertions(2);

    const request = createRequestWithFormData({
      profileId: "some-user-id",
    });

    getSessionUserOrThrow.mockResolvedValueOnce({ id: "some-user-id" } as User);

    (prismaClient.profile.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-user-id",
      participatedEvents: [],
      waitingForEvents: [
        {
          event: {
            slug: "some-event-slug",
          },
        },
      ],
    });

    const response = await action({
      request,
      context: {},
      params: { slug: "some-event-slug" },
    });
    const responseBody = await response.json();

    expect(responseBody.success).toBe(false);
    // TODO: fix type issue
    // @ts-ignore
    expect(responseBody.errors.profileId).toStrictEqual([
      "error.inputError.alreadyOn",
    ]);
  });

  test("already participant", async () => {
    expect.assertions(2);

    const request = createRequestWithFormData({
      profileId: "some-user-id",
    });

    getSessionUserOrThrow.mockResolvedValueOnce({ id: "some-user-id" } as User);

    (prismaClient.profile.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-user-id",
      participatedEvents: [
        {
          event: {
            slug: "some-event-slug",
          },
        },
      ],
      waitingForEvents: [],
    });

    const response = await action({
      request,
      context: {},
      params: { slug: "some-event-slug" },
    });
    const responseBody = await response.json();

    expect(responseBody.success).toBe(false);
    // TODO: fix type issue
    // @ts-ignore
    expect(responseBody.errors.profileId).toStrictEqual([
      "error.inputError.alreadyParticipant",
    ]);
  });

  test("event not found", async () => {
    const request = createRequestWithFormData({
      profileId: "some-user-id",
    });

    expect.assertions(1);

    getSessionUserOrThrow.mockResolvedValueOnce({ id: "some-user-id" } as User);

    (prismaClient.profile.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-user-id",
      participatedEvents: [],
      waitingForEvents: [],
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

  test("add different user to waiting list (admin)", async () => {
    expect.assertions(2);

    const request = createRequestWithFormData({
      profileId: "another-user-id",
    });

    getSessionUserOrThrow.mockResolvedValueOnce({ id: "some-user-id" } as User);

    (prismaClient.profile.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "another-user-id",
      firstName: "some-first-name",
      lastName: "some-last-name",
      participatedEvents: [],
      waitingForEvents: [],
    });

    (prismaClient.event.findUnique as jest.Mock).mockResolvedValueOnce({
      id: "some-event-id",
    });

    (prismaClient.event.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-event-id",
    });

    const response = await action({
      request,
      context: {},
      params: { slug: "some-event-slug" },
    });
    const responseBody = await response.json();
    expect(
      prismaClient.waitingParticipantOfEvent.create
    ).toHaveBeenLastCalledWith({
      data: {
        eventId: "some-event-id",
        profileId: "another-user-id",
      },
    });
    // TODO: fix type issue
    // @ts-ignore
    expect(responseBody.message).toBe("feedback");
  });

  test("add yourself as participant (admin and authenticated)", async () => {
    expect.assertions(2);

    const request = createRequestWithFormData({
      profileId: "some-user-id",
    });

    getSessionUserOrThrow.mockResolvedValueOnce({ id: "some-user-id" } as User);

    (prismaClient.profile.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-user-id",
      firstName: "some-first-name",
      lastName: "some-last-name",
      participatedEvents: [],
      waitingForEvents: [],
    });

    (prismaClient.event.findUnique as jest.Mock).mockResolvedValueOnce({
      id: "some-event-id",
    });

    const response = await action({
      request,
      context: {},
      params: { slug: "some-event-slug" },
    });
    const responseBody = await response.json();
    expect(
      prismaClient.waitingParticipantOfEvent.create
    ).toHaveBeenLastCalledWith({
      data: {
        eventId: "some-event-id",
        profileId: "some-user-id",
      },
    });
    // TODO: fix type issue
    // @ts-ignore
    expect(responseBody.message).toBe("feedback");
  });
});
