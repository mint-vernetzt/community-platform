import { User } from "@supabase/supabase-js";
import * as authServerModule from "~/auth.server";
import { createRequestWithFormData } from "~/lib/utils/tests";
import { prismaClient } from "~/prisma";
import { action } from "./add-to-waiting-list";

// @ts-ignore
const expect = global.expect as jest.Expect;

const getSessionUser = jest.spyOn(authServerModule, "getSessionUser");

jest.mock("~/prisma", () => {
  return {
    prismaClient: {
      event: {
        findFirst: jest.fn(),
      },
      waitingParticipantOfEvent: {
        create: jest.fn(),
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

describe("/event/$slug/settings/participants/add-to-waiting-list", () => {
  beforeAll(() => {
    process.env.FEATURES = "events";
  });

  test("anon user", async () => {
    const request = createRequestWithFormData({});

    expect.assertions(2);

    getSessionUser.mockResolvedValue(null);

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
      eventId: "some-event-id",
      email: "anotheruser@mail.com",
    });

    expect.assertions(2);

    (prismaClient.event.findFirst as jest.Mock).mockResolvedValue(null);

    getSessionUser.mockResolvedValue({ id: "some-user-id" } as User);

    (prismaClient.profile.findFirst as jest.Mock).mockImplementationOnce(() => {
      return { waitingForEvents: [] };
    });

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
      eventId: "some-event-id",
      email: "anotheruser@mail.com",
    });

    expect.assertions(2);

    getSessionUser.mockResolvedValue({ id: "some-user-id" } as User);

    (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
      return { id: "some-event-id" };
    });
    (
      prismaClient.teamMemberOfEvent.findFirst as jest.Mock
    ).mockImplementationOnce(() => {
      return null;
    });

    (prismaClient.profile.findFirst as jest.Mock).mockImplementationOnce(() => {
      return { waitingForEvents: [] };
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

    getSessionUser.mockResolvedValue({ id: "another-user-id" } as User);

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
      email: "anotheruser@mail.com",
    });

    getSessionUser.mockResolvedValue({ id: "some-user-id" } as User);
    (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
      return { id: "another-event-id" };
    });
    (
      prismaClient.teamMemberOfEvent.findFirst as jest.Mock
    ).mockImplementationOnce(() => {
      return { isPrivileged: true };
    });

    (prismaClient.profile.findFirst as jest.Mock).mockImplementationOnce(() => {
      return { waitingForEvents: [] };
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

  test("already member", async () => {
    expect.assertions(2);

    const request = createRequestWithFormData({
      userId: "some-user-id",
      eventId: "some-event-id",
      email: "anotheruser@mail.com",
    });

    getSessionUser.mockResolvedValue({ id: "some-user-id" } as User);
    (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
      return { id: "some-event-id" };
    });
    (prismaClient.profile.findFirst as jest.Mock).mockImplementationOnce(() => {
      return {
        waitingForEvents: [
          {
            event: {
              id: "some-event-id",
            },
          },
        ],
      };
    });
    (
      prismaClient.teamMemberOfEvent.findFirst as jest.Mock
    ).mockImplementationOnce(() => {
      return { isPrivileged: true };
    });

    try {
      const response = await action({
        request,
        context: {},
        params: {},
      });
      console.log(response);

      expect(response.success).toBe(false);
      expect(response.errors.email).toContain(
        "Das Profil unter dieser E-Mail ist bereits auf der Warteliste Eurer Veranstaltung."
      );
    } catch (error) {}
  });

  test("add to waiting list (privileged user)", async () => {
    expect.assertions(2);

    const request = createRequestWithFormData({
      userId: "some-user-id",
      eventId: "some-event-id",
      email: "anotheruser@mail.com",
    });

    getSessionUser.mockResolvedValue({ id: "some-user-id" } as User);
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

    (prismaClient.profile.findFirst as jest.Mock).mockImplementationOnce(() => {
      return { waitingForEvents: [] };
    });

    (prismaClient.profile.findFirst as jest.Mock).mockImplementationOnce(() => {
      return {
        id: "another-user-id",
      };
    });

    try {
      const result = await action({
        request,
        context: {},
        params: {},
      });
      expect(
        prismaClient.waitingParticipantOfEvent.create
      ).toHaveBeenLastCalledWith({
        data: {
          eventId: "some-event-id",
          profileId: "another-user-id",
        },
      });
      expect(result.success).toBe(true);
    } catch (error) {}
  });

  test("add to waiting list (self)", async () => {
    expect.assertions(2);

    const request = createRequestWithFormData({
      userId: "some-user-id",
      eventId: "some-event-id",
      email: "someuser@mail.com",
    });

    getSessionUser.mockResolvedValue({
      id: "some-user-id",
      email: "someuser@mail.com",
    } as User);
    (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
      return {
        id: "some-event-id",
      };
    });
    (prismaClient.profile.findFirst as jest.Mock).mockImplementationOnce(() => {
      return { waitingForEvents: [] };
    });

    try {
      const result = await action({
        request,
        context: {},
        params: {},
      });
      expect(
        prismaClient.waitingParticipantOfEvent.create
      ).toHaveBeenLastCalledWith({
        data: {
          eventId: "some-event-id",
          profileId: "some-user-id",
        },
      });
      expect(result.success).toBe(true);
    } catch (error) {}
  });

  afterAll(() => {
    delete process.env.FEATURES;
  });
});
