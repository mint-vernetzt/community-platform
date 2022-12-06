import type { User } from "@supabase/supabase-js";
import * as authServerModule from "~/auth.server";
import { createRequestWithFormData } from "~/lib/utils/tests";
import { prismaClient } from "~/prisma";
import { action } from "./remove-speaker";

// @ts-ignore
const expect = global.expect as jest.Expect;

const getSessionUserOrThrow = jest.spyOn(
  authServerModule,
  "getSessionUserOrThrow"
);

jest.mock("~/prisma", () => {
  return {
    prismaClient: {
      event: {
        findFirst: jest.fn(),
      },
      speakerOfEvent: {
        delete: jest.fn(),
      },
      teamMemberOfEvent: {
        findFirst: jest.fn(),
      },
      profile: {
        findFirst: jest.fn(),
      },
    },
  };
});

describe("/event/$slug/settings/speakers/remove-speaker", () => {
  beforeAll(() => {
    process.env.FEATURES = "events";
  });

  test("anon user", async () => {
    const request = createRequestWithFormData({});

    expect.assertions(2);

    try {
      await action({
        request,
        context: {},
        params: {},
      });
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json.message).toBe("No session or session user found");
    }
  });

  test("event not found", async () => {
    const request = createRequestWithFormData({
      userId: "some-user-id",
    });

    expect.assertions(2);

    (prismaClient.event.findFirst as jest.Mock).mockResolvedValue(null);

    getSessionUserOrThrow.mockResolvedValue({ id: "some-user-id" } as User);

    try {
      await action({ request, context: {}, params: {} });
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(404);

      const json = await response.json();
      expect(json.message).toBe("Event not found");
    }
  });

  test("not privileged user", async () => {
    const request = createRequestWithFormData({
      userId: "some-user-id",
    });

    expect.assertions(2);

    getSessionUserOrThrow.mockResolvedValue({ id: "some-user-id" } as User);

    (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
      return {};
    });
    (
      prismaClient.teamMemberOfEvent.findFirst as jest.Mock
    ).mockImplementationOnce(() => {
      return null;
    });

    try {
      await action({
        request,
        context: {},
        params: {},
      });
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json.message).toBe("Not privileged");
    }
  });

  test("different user id", async () => {
    const request = createRequestWithFormData({ userId: "some-user-id" });

    expect.assertions(2);

    getSessionUserOrThrow.mockResolvedValue({ id: "another-user-id" } as User);

    try {
      await action({
        request,
        context: {},
        params: {},
      });
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json.message).toBe("Identity check failed");
    }
  });

  test("different event id", async () => {
    expect.assertions(2);

    const request = createRequestWithFormData({
      userId: "some-user-id",
      eventId: "some-event-id",
    });

    getSessionUserOrThrow.mockResolvedValue({ id: "some-user-id" } as User);
    (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
      return { id: "another-event-id" };
    });
    (
      prismaClient.teamMemberOfEvent.findFirst as jest.Mock
    ).mockImplementationOnce(() => {
      return { isPrivileged: true };
    });

    try {
      await action({
        request,
        context: {},
        params: {},
      });
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.message).toBe("Event IDs differ");
    }
  });

  test("remove event team member", async () => {
    expect.assertions(2);

    const request = createRequestWithFormData({
      userId: "some-user-id",
      eventId: "some-event-id",
      speakerId: "another-user-id",
    });

    getSessionUserOrThrow.mockResolvedValue({ id: "some-user-id" } as User);
    (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
      return {
        id: "some-event-id",
      };
    });
    (
      prismaClient.teamMemberOfEvent.findFirst as jest.Mock
    ).mockImplementationOnce(() => {
      return { isPrivileged: true };
    });

    const response = await action({
      request,
      context: {},
      params: {},
    });
    const responseBody = await response.json();
    expect(prismaClient.speakerOfEvent.delete).toHaveBeenLastCalledWith({
      where: {
        profileId_eventId: {
          eventId: "some-event-id",
          profileId: "another-user-id",
        },
      },
    });
    expect(responseBody.success).toBe(true);
  });

  afterAll(() => {
    delete process.env.FEATURES;
  });
});
