import type { User } from "@supabase/supabase-js";
import * as authServerModule from "~/auth.server";
import { createRequestWithFormData } from "~/lib/utils/tests";
import { prismaClient } from "~/prisma";
import { action } from "./publish";

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
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      teamMemberOfEvent: {
        findFirst: jest.fn(),
      },
    },
  };
});

describe("/event/$slug/settings/events/publish", () => {
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
    const request = createRequestWithFormData({ userId: "some-user-id" });

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

  test("authenticated user", async () => {
    const request = createRequestWithFormData({ userId: "some-user-id" });

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

  test("not privileged user", async () => {
    const request = createRequestWithFormData({ userId: "some-user-id" });

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
      return { id: "another-event-id", userId: "some-user-id" };
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

  test("publish event", async () => {
    const request = createRequestWithFormData({
      userId: "some-user-id",
      eventId: "some-event-id",
      publish: "on",
    });

    getSessionUserOrThrow.mockResolvedValue({ id: "some-user-id" } as User);
    (
      prismaClient.teamMemberOfEvent.findFirst as jest.Mock
    ).mockImplementationOnce(() => {
      return { isPrivileged: true };
    });
    (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
      return {
        id: "some-event-id",
        userId: "some-user-id",
      };
    });

    // some-event-id
    (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
      return { childEvents: [{ id: "1" }, { id: "2" }] };
    });
    // event id "1"
    (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
      return { childEvents: [{ id: "3" }, { id: "4" }] };
    });
    // event id "2"
    (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
      return { childEvents: [] };
    });
    // event id "3"
    (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
      return { childEvents: [] };
    });
    // event id "4"
    (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
      return { childEvents: [{ id: "5" }] };
    });
    // event id "5"
    (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
      return { childEvents: [] };
    });

    await action({
      request,
      context: {},
      params: {},
    });
    expect(prismaClient.event.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: {
            in: ["some-event-id", "1", "2", "3", "4", "5"],
          },
        },
      })
    );
  });

  afterAll(() => {
    delete process.env.FEATURES;
  });
});
