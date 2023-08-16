import type { User } from "@supabase/supabase-js";
import * as authServerModule from "~/auth.server";
import { createRequestWithFormData } from "~/lib/utils/tests";
import { prismaClient } from "~/prisma.server";
import { action } from "./set-parent";

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
        update: jest.fn(),
      },
      teamMemberOfEvent: {
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

describe("/event/$slug/settings/events/set-parent", () => {
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

  test("not privileged user", async () => {
    const request = createRequestWithFormData({
      userId: "some-user-id",
      eventId: "some-event-id",
      parentEventId: "some-parent-id",
    });

    expect.assertions(2);

    getSessionUserOrThrow.mockResolvedValue({ id: "some-user-id" } as User);

    (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
      return {
        id: "some-event-id",
      };
    });
    (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
      return {
        id: "some-parent-id",
        name: "some-parent-name",
      };
    });
    (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
      return {
        id: "some-event-id",
      };
    });
    (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
      return {
        id: "some-parent-id",
        name: "some-parent-name",
      };
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
      parentEventId: "some-parent-id",
    });

    getSessionUserOrThrow.mockResolvedValue({ id: "some-user-id" } as User);
    (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
      return {
        id: "another-event-id",
      };
    });
    (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
      return {
        id: "another-parent-id",
        name: "another-parent-name",
      };
    });
    (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
      return {
        id: "another-event-id",
      };
    });
    (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
      return {
        id: "another-parent-id",
        name: "another-parent-name",
      };
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

  test("unset parent event", async () => {
    expect.assertions(2);

    const request = createRequestWithFormData({
      userId: "some-user-id",
      eventId: "some-event-id",
    });

    getSessionUserOrThrow.mockResolvedValue({ id: "some-user-id" } as User);
    (prismaClient.event.findFirst as jest.Mock)
      .mockReset()
      .mockImplementationOnce(() => {
        return {
          id: "some-event-id",
        };
      });
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
    expect(prismaClient.event.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ parentEvent: { disconnect: true } }),
      })
    );
    expect(responseBody.message).toBe(
      "Die aktuelle Rahmenversanstaltung ist jetzt nicht mehr Rahmenveranstaltung deiner Veranstaltung."
    );
  });

  test("set parent event", async () => {
    expect.assertions(2);

    const request = createRequestWithFormData({
      userId: "some-user-id",
      eventId: "some-event-id",
      parentEventId: "some-parent-event",
    });

    getSessionUserOrThrow.mockResolvedValue({ id: "some-user-id" } as User);
    (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
      return {
        id: "some-event-id",
      };
    });
    (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
      return {
        id: "some-parent-id",
        name: "some-parent-name",
      };
    });
    (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
      return {
        id: "some-event-id",
      };
    });
    (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
      return {
        id: "some-parent-id",
        name: "some-parent-name",
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
    expect(prismaClient.event.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          parentEvent: expect.objectContaining({
            connect: { id: "some-parent-event" },
          }),
        }),
      })
    );
    expect(responseBody.message).toBe(
      'Die Veranstaltung "some-parent-name" ist jetzt Rahmenveranstaltung für Eure Veranstaltung.'
    );
  });
});
