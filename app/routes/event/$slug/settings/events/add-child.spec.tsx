import { User } from "@supabase/supabase-js";
import * as authServerModule from "~/auth.server";
import { createRequestWithFormData } from "~/lib/utils/tests";
import { prismaClient } from "~/prisma";
import { action } from "./add-child";

// @ts-ignore
const expect = global.expect as jest.Expect;

const getSessionUser = jest.spyOn(authServerModule, "getSessionUser");

jest.mock("~/prisma", () => {
  return {
    prismaClient: {
      event: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      teamMemberOfEvent: {
        findFirst: jest.fn(),
      },
    },
  };
});

describe("/event/$slug/settings/events/add-child", () => {
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
      childEventId: "another-user-id",
    });

    expect.assertions(2);

    (prismaClient.event.findFirst as jest.Mock).mockResolvedValue(null);

    getSessionUser.mockResolvedValue({ id: "some-user-id" } as User);

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
    const request = createRequestWithFormData({
      userId: "some-user-id",
      childEventId: "another-user-id",
    });

    expect.assertions(2);

    getSessionUser.mockResolvedValue({ id: "some-user-id" } as User);

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
    const request = createRequestWithFormData({
      userId: "some-user-id",
      childEventId: "another-user-id",
    });

    expect.assertions(2);

    getSessionUser.mockResolvedValue({ id: "some-user-id" } as User);

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
      childEventId: "another-user-id",
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

  test("add child event", async () => {
    expect.assertions(3);

    const request = createRequestWithFormData({
      userId: "some-user-id",
      eventId: "some-event-id",
      childEventId: "child-event-id",
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

    try {
      const result = await action({
        request,
        context: {},
        params: {},
      });
      expect(prismaClient.event.update).toHaveBeenLastCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            childEvents: expect.objectContaining({
              connect: { id: "child-event-id" },
            }),
          }),
        })
      );
      expect(result.success).toBe(true);
      expect(result.data.childEventId).toBe("child-event-id");
    } catch (error) {
      const response = error as Response;
      console.log(response);

      const json = await response.json();
      console.log(json);
    }
  });

  afterAll(() => {
    delete process.env.FEATURES;
  });
});
