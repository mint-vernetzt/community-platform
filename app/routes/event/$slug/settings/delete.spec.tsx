import type { User } from "@supabase/supabase-js";
import { redirect } from "@remix-run/node";
import * as authServerModule from "~/auth.server";
import { createRequestWithFormData, testURL } from "~/lib/utils/tests";
import { prismaClient } from "~/prisma.server";
import { action, loader } from "./delete";

// @ts-ignore
const expect = global.expect as jest.Expect;

const getSessionUserOrThrow = jest.spyOn(
  authServerModule,
  "getSessionUserOrThrow"
);

jest.mock("~/lib/utils/application", () => {
  return {
    checkFeatureAbilitiesOrThrow: jest.fn(),
  };
});

jest.mock("~/prisma.server", () => {
  return {
    prismaClient: {
      event: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
      profile: {
        findFirst: jest.fn(),
      },
    },
  };
});

const slug = "slug-test";

describe("/event/$slug/settings/delete", () => {
  describe("loader", () => {
    test("no params", async () => {
      expect.assertions(2);

      const request = new Request(testURL);
      try {
        await loader({ request, context: {}, params: {} });
      } catch (error) {
        const response = error as Response;
        expect(response.status).toBe(400);

        const json = await response.json();
        expect(json.message).toBe('"slug" missing');
      }
    });

    test("anon user", async () => {
      expect.assertions(2);

      try {
        await loader({
          request: new Request(testURL),
          context: {},
          params: { slug },
        });
      } catch (error) {
        const response = error as Response;
        expect(response.status).toBe(401);

        const json = await response.json();
        expect(json.message).toBe("No session or session user found");
      }
    });

    test("event not found", async () => {
      expect.assertions(1);

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

      (prismaClient.event.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const request = new Request(testURL);
      try {
        await loader({ request, context: {}, params: { slug } });
      } catch (error) {
        const response = error as Response;
        expect(response.status).toBe(404);
      }
    });

    test("authenticated user", async () => {
      expect.assertions(1);

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

      (prismaClient.event.findUnique as jest.Mock).mockResolvedValueOnce({
        id: "some-event-id",
      });

      (prismaClient.event.findFirst as jest.Mock).mockResolvedValueOnce(null);

      try {
        await loader({
          request: new Request(testURL),
          context: {},
          params: { slug },
        });
      } catch (error) {
        const response = error as Response;
        expect(response.status).toBe(403);
      }
    });

    test("admin user", async () => {
      expect.assertions(3);

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

      (prismaClient.event.findUnique as jest.Mock).mockResolvedValueOnce({
        id: "some-event-id",
        published: true,
        name: "some-event-name",
        childEvents: [
          {
            id: "child-event-id",
            name: "child-event-name",
            slug: "child-event-slug",
          },
        ],
      });

      (prismaClient.event.findFirst as jest.Mock).mockResolvedValueOnce({
        id: "some-event-id",
      });

      const response = await loader({
        request: new Request(testURL),
        context: {},
        params: { slug },
      });
      const responseBody = await response.json();
      expect(responseBody.published).toBe(true);
      expect(responseBody.eventName).toBe("some-event-name");
      expect(responseBody.childEvents).toStrictEqual([
        {
          id: "child-event-id",
          name: "child-event-name",
          slug: "child-event-slug",
        },
      ]);
    });
  });

  describe("action", () => {
    test("no params", async () => {
      const request = createRequestWithFormData({});

      expect.assertions(2);

      try {
        await action({ request, context: {}, params: {} });
      } catch (error) {
        const response = error as Response;
        expect(response.status).toBe(400);

        const json = await response.json();
        expect(json.message).toBe('"slug" missing');
      }
    });

    test("anon user", async () => {
      const request = createRequestWithFormData({});

      expect.assertions(2);

      try {
        await action({
          request,
          context: {},
          params: { slug },
        });
      } catch (error) {
        const response = error as Response;
        expect(response.status).toBe(401);

        const json = await response.json();
        expect(json.message).toBe("No session or session user found");
      }
    });

    test("authenticated user", async () => {
      const request = createRequestWithFormData({});

      expect.assertions(1);

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

      (prismaClient.event.findFirst as jest.Mock).mockResolvedValueOnce(null);

      try {
        await action({
          request,
          context: {},
          params: { slug },
        });
      } catch (error) {
        const response = error as Response;
        expect(response.status).toBe(403);
      }
    });

    test("event not found", async () => {
      const request = createRequestWithFormData({ userId: "some-user-id" });

      expect.assertions(1);

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

      (prismaClient.event.findFirst as jest.Mock).mockResolvedValueOnce({
        id: "some-event-id",
      });

      (prismaClient.event.findUnique as jest.Mock).mockResolvedValueOnce(null);

      try {
        await action({ request, context: {}, params: { slug } });
      } catch (error) {
        const response = error as Response;
        expect(response.status).toBe(404);
      }
    });

    test("different event name", async () => {
      expect.assertions(2);

      const request = createRequestWithFormData({
        eventName: "wrong-event-name",
      });

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

      (prismaClient.event.findFirst as jest.Mock).mockResolvedValueOnce({
        id: "some-event-id",
      });

      (prismaClient.event.findUnique as jest.Mock).mockResolvedValueOnce({
        id: "some-event-id",
        name: "some-event-name",
      });

      const response = await action({
        request,
        context: {},
        params: { slug },
      });
      const responseBody = await response.json();

      expect(responseBody.errors.eventName).toBeDefined();
      // TODO: fix type issue
      // @ts-ignore
      expect(responseBody.errors.eventName[0]).toBe("error.input");
    });

    test("profile not found", async () => {
      expect.assertions(1);

      const request = createRequestWithFormData({
        eventName: "some-event-name",
      });

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

      (prismaClient.event.findFirst as jest.Mock).mockResolvedValueOnce({
        id: "some-event-id",
      });

      (prismaClient.event.findUnique as jest.Mock).mockResolvedValueOnce({
        id: "some-event-id",
        name: "some-event-name",
      });

      (prismaClient.profile.findFirst as jest.Mock).mockResolvedValueOnce(null);

      try {
        await action({ request, context: {}, params: { slug } });
      } catch (error) {
        const response = error as Response;
        expect(response.status).toBe(404);
      }
    });

    test("delete", async () => {
      expect.assertions(2);

      const request = createRequestWithFormData({
        eventName: "some-event-name",
      });

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

      (prismaClient.event.findFirst as jest.Mock).mockResolvedValueOnce({
        id: "some-event-id",
      });

      (prismaClient.event.findUnique as jest.Mock).mockResolvedValueOnce({
        id: "some-event-id",
        name: "some-event-name",
      });

      (prismaClient.profile.findFirst as jest.Mock).mockResolvedValueOnce({
        username: "someuser",
      });

      const response = await action({
        request,
        context: {},
        params: { slug },
      });

      expect(response).toEqual(redirect("/profile/someuser"));
      expect(prismaClient.event.delete).toHaveBeenLastCalledWith({
        where: {
          slug: slug,
        },
      });
    });
  });
});
