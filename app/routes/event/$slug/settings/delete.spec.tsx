import type { User } from "@supabase/supabase-js";
import { redirect } from "@remix-run/node";
import * as authServerModule from "~/auth.server";
import { createRequestWithFormData, testURL } from "~/lib/utils/tests";
import { prismaClient } from "~/prisma";
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

jest.mock("~/prisma", () => {
  return {
    prismaClient: {
      event: {
        findFirst: jest.fn(),
        delete: jest.fn(),
      },
      teamMemberOfEvent: {
        findFirst: jest.fn(),
      },
      focus: {
        findMany: jest.fn(),
      },
      area: {
        findMany: jest.fn(),
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
      expect.assertions(2);

      (prismaClient.event.findFirst as jest.Mock).mockResolvedValue(null);

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

      const request = new Request(testURL);
      try {
        await loader({ request, context: {}, params: { slug } });
      } catch (error) {
        const response = error as Response;
        expect(response.status).toBe(404);

        const json = await response.json();
        expect(json.message).toBe("Event not found");
      }
    });

    test("not privileged user", async () => {
      expect.assertions(2);

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

      (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
        return { slug };
      });
      (
        prismaClient.teamMemberOfEvent.findFirst as jest.Mock
      ).mockImplementationOnce(() => {
        return null;
      });

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
        expect(json.message).toBe("Not privileged");
      }
    });

    test("privileged user", async () => {
      expect.assertions(4);

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

      (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
        return {
          id: "some-event-id",
          name: "some-event-name",
          childEvents: [
            {
              id: "child-event-id",
              name: "child-event-name",
              slug: "child-event-slug",
            },
          ],
        };
      });
      (
        prismaClient.teamMemberOfEvent.findFirst as jest.Mock
      ).mockImplementationOnce(() => {
        return { isPrivileged: true };
      });

      const response = await loader({
        request: new Request(testURL),
        context: {},
        params: { slug },
      });
      const responseBody = await response.json();
      expect(responseBody.userId).toBe("some-user-id");
      expect(responseBody.eventId).toBe("some-event-id");
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

    test("event not found", async () => {
      const request = createRequestWithFormData({ userId: "some-user-id" });

      expect.assertions(2);

      (prismaClient.event.findFirst as jest.Mock).mockResolvedValue(null);

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

      try {
        await action({ request, context: {}, params: { slug } });
      } catch (error) {
        const response = error as Response;
        expect(response.status).toBe(404);

        const json = await response.json();
        expect(json.message).toBe("Event not found");
      }
    });

    test("not privileged user", async () => {
      const request = createRequestWithFormData({ userId: "some-user-id" });

      expect.assertions(2);

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

      (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
        return { slug };
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
          params: { slug },
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

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "another-user-id",
      } as User);

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
        expect(json.message).toBe("Identity check failed");
      }
    });

    test("different event id", async () => {
      expect.assertions(2);

      const request = createRequestWithFormData({
        userId: "some-user-id",
        eventId: "some-event-id",
        eventName: "Some event name",
      });

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);
      (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
        return { id: "another-event-id", name: "Some other event name", slug };
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
          params: { slug },
        });
      } catch (error) {
        const response = error as Response;
        expect(response.status).toBe(400);

        const json = await response.json();
        expect(json.message).toBe("Id nicht korrekt");
      }
    });

    test("different event name", async () => {
      const request = createRequestWithFormData({
        userId: "some-user-id",
        eventId: "some-event-id",
        eventName: "Some event name",
      });

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);
      (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
        return { id: "some-event-id", name: "Some other event name", slug };
      });
      (
        prismaClient.teamMemberOfEvent.findFirst as jest.Mock
      ).mockImplementationOnce(() => {
        return { isPrivileged: true };
      });

      const response = await action({
        request,
        context: {},
        params: { slug },
      });
      const responseBody = await response.json();

      expect(responseBody.errors.eventName).toBeDefined();
      expect(responseBody.errors.eventName[0]).toBe(
        "Der Name der Veranstaltung ist nicht korrekt"
      );
    });

    test("delete", async () => {
      const request = createRequestWithFormData({
        userId: "some-user-id",
        eventId: "some-event-id",
        eventName: "Some event name",
      });

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as unknown as User);
      (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
        return { id: "some-event-id", name: "Some event name", slug };
      });
      (
        prismaClient.teamMemberOfEvent.findFirst as jest.Mock
      ).mockImplementationOnce(() => {
        return { isPrivileged: true };
      });
      (prismaClient.profile.findFirst as jest.Mock).mockResolvedValue({
        username: "someuser",
      });

      const response = await action({
        request,
        context: {},
        params: { slug },
      });

      expect(response).toEqual(redirect("/profile/someuser"));
    });
  });
});
