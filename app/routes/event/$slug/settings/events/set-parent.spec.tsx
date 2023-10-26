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
        findUnique: jest.fn(),
        update: jest.fn(),
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

    getSessionUserOrThrow.mockResolvedValue({ id: "some-user-id" } as User);

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
    const request = createRequestWithFormData({
      parentEventId: "some-parent-id",
    });

    expect.assertions(4);

    getSessionUserOrThrow.mockResolvedValueOnce({ id: "some-user-id" } as User);

    (prismaClient.event.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-event-id",
    });

    (prismaClient.event.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const response = await action({
      request,
      context: {},
      params: { slug: "some-event-slug" },
    });
    const responseBody = await response.json();
    expect(responseBody.success).toBe(false);
    expect(responseBody.errors).toBeDefined();
    expect(responseBody.errors).not.toBeNull();
    expect(responseBody.errors._global).toStrictEqual([
      "error.notFound.current",
    ]);
  });

  test("parent event not found", async () => {
    const request = createRequestWithFormData({
      parentEventId: "some-parent-id",
    });

    expect.assertions(4);

    getSessionUserOrThrow.mockResolvedValueOnce({ id: "some-user-id" } as User);

    (prismaClient.event.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-event-id",
    });

    (prismaClient.event.findUnique as jest.Mock).mockResolvedValueOnce({
      id: "some-event-id",
    });

    (prismaClient.event.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const response = await action({
      request,
      context: {},
      params: { slug: "some-event-slug" },
    });
    const responseBody = await response.json();
    expect(responseBody.success).toBe(false);
    expect(responseBody.errors).toBeDefined();
    expect(responseBody.errors).not.toBeNull();
    expect(responseBody.errors._global).toStrictEqual([
      "error.notFound.parent",
    ]);
  });

  test("child event not inside the timespan of parent event", async () => {
    const request = createRequestWithFormData({
      parentEventId: "some-parent-id",
    });

    expect.assertions(4);

    getSessionUserOrThrow.mockResolvedValueOnce({ id: "some-user-id" } as User);

    (prismaClient.event.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-event-id",
    });

    (prismaClient.event.findUnique as jest.Mock).mockResolvedValueOnce({
      id: "some-event-id",
      startTime: new Date("2023-05-09T13:00:00.000Z"),
      endTime: new Date("2023-05-09T17:00:00.000Z"),
    });

    (prismaClient.event.findUnique as jest.Mock).mockResolvedValueOnce({
      id: "some-parent-id",
      startTime: new Date("2023-05-09T14:00:00.000Z"),
      endTime: new Date("2023-05-09T16:00:00.000Z"),
    });

    const response = await action({
      request,
      context: {},
      params: { slug: "some-event-slug" },
    });
    const responseBody = await response.json();
    expect(responseBody.success).toBe(false);
    expect(responseBody.errors).toBeDefined();
    expect(responseBody.errors).not.toBeNull();
    expect(responseBody.errors.parentEventId).toStrictEqual([
      "error.notInTime",
    ]);
  });

  test("unset parent event", async () => {
    expect.assertions(2);

    const request = createRequestWithFormData({});

    getSessionUserOrThrow.mockResolvedValue({ id: "some-user-id" } as User);
    (prismaClient.event.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-event-id",
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
    expect(prismaClient.event.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ parentEvent: { disconnect: true } }),
      })
    );
    expect(responseBody.message).toBe("feedback");
  });

  test("set parent event", async () => {
    expect.assertions(2);

    const request = createRequestWithFormData({
      parentEventId: "some-parent-event",
    });

    getSessionUserOrThrow.mockResolvedValueOnce({ id: "some-user-id" } as User);

    (prismaClient.event.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-event-id",
    });

    (prismaClient.event.findUnique as jest.Mock).mockResolvedValueOnce({
      id: "some-event-id",
      startTime: new Date("2023-05-09T14:00:00.000Z"),
      endTime: new Date("2023-05-09T16:00:00.000Z"),
    });

    (prismaClient.event.findUnique as jest.Mock).mockResolvedValueOnce({
      id: "some-parent-event",
      startTime: new Date("2023-05-09T13:00:00.000Z"),
      endTime: new Date("2023-05-09T17:00:00.000Z"),
      name: "some-parent-name",
    });

    const response = await action({
      request,
      context: {},
      params: { slug: "some-event-slug" },
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
