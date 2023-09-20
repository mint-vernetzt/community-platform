import type { User } from "@supabase/supabase-js";
import * as authServerModule from "~/auth.server";
import { createRequestWithFormData } from "~/lib/utils/tests";
import { prismaClient } from "~/prisma.server";
import { action } from "./publish";

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
        updateMany: jest.fn(),
      },
    },
  };
});

jest.mock("~/lib/utils/application", () => {
  return {
    checkFeatureAbilitiesOrThrow: jest.fn(),
  };
});

describe("/event/$slug/settings/events/publish", () => {
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

  test("publish event", async () => {
    const request = createRequestWithFormData({
      publish: "on",
    });

    getSessionUserOrThrow.mockResolvedValue({ id: "some-user-id" } as User);

    (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
      return {
        id: "some-event-id",
      };
    });

    // some-event-id
    (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
      return { childEvents: [{ slug: "1" }, { slug: "2" }] };
    });
    // event slug "1"
    (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
      return { childEvents: [{ slug: "3" }, { slug: "4" }] };
    });
    // event slug "2"
    (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
      return { childEvents: [] };
    });
    // event slug "3"
    (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
      return { childEvents: [] };
    });
    // event slug "4"
    (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
      return { childEvents: [{ slug: "5" }] };
    });
    // event slug "5"
    (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
      return { childEvents: [] };
    });

    await action({
      request,
      context: {},
      params: { slug: "some-event-slug" },
    });
    expect(prismaClient.event.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          slug: {
            in: ["some-event-slug", "1", "2", "3", "4", "5"],
          },
        },
      })
    );
  });
});
