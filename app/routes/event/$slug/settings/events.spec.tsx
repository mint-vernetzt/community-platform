import type { User } from "@supabase/supabase-js";
import * as authServerModule from "~/auth.server";
import { prismaClient } from "~/prisma.server";
import { testURL } from "~/lib/utils/tests";
import { loader } from "./events";
import * as imageServerModule from "~/images.server";

// @ts-ignore
const expect = global.expect as jest.Expect;

const getSessionUserOrThrow = jest.spyOn(
  authServerModule,
  "getSessionUserOrThrow"
);

const getImageURL = jest.spyOn(imageServerModule, "getImageURL");

const slug = "slug-test";

jest.mock("~/prisma.server", () => {
  return {
    prismaClient: {
      event: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      teamMemberOfEvent: {
        findMany: jest.fn(),
      },
    },
  };
});

jest.mock("~/lib/utils/application", () => {
  return {
    checkFeatureAbilitiesOrThrow: jest.fn(),
  };
});

describe("/event/$slug/settings/events", () => {
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

    test("admin user without autocomplete query", async () => {
      expect.assertions(5);

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

      (prismaClient.event.findUnique as jest.Mock).mockResolvedValueOnce({
        id: "some-event-id",
        published: true,
        childEvents: [
          {
            background: "some-background-path",
          },
        ],
        parentEvent: {
          background: "another-background-path",
        },
      });

      (prismaClient.event.findFirst as jest.Mock).mockResolvedValueOnce({
        id: "some-event-id",
      });

      getImageURL.mockImplementationOnce(() => "some-background-image-url");

      getImageURL.mockImplementationOnce(() => "another-background-image-url");

      const response = await loader({
        request: new Request(testURL),
        context: {},
        params: { slug },
      });
      const responseBody = await response.json();
      expect(responseBody.parentEvent).toStrictEqual({
        background: "another-background-image-url",
      });
      expect(responseBody.parentEventSuggestions).toBe(undefined);
      expect(responseBody.childEvents).toStrictEqual([
        {
          background: "some-background-image-url",
        },
      ]);
      expect(responseBody.childEventSuggestions).toBe(undefined);
      expect(responseBody.published).toBe(true);
    });

    test("admin user with parent autocomplete query", async () => {
      expect.assertions(5);

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

      (prismaClient.event.findUnique as jest.Mock).mockResolvedValueOnce({
        id: "some-event-id",
        published: true,
        childEvents: [],
        parentEvent: {
          id: "already-parent-id",
          name: "same-parent-name",
          background: null,
        },
      });

      (prismaClient.event.findFirst as jest.Mock).mockResolvedValueOnce({
        id: "some-event-id",
      });

      (prismaClient.event.findMany as jest.Mock).mockResolvedValueOnce([
        {
          id: "some-parent-id",
          name: "same-parent-name",
          background: null,
        },
      ]);

      const response = await loader({
        request: new Request(`${testURL}?parent_autocomplete_query=same`),
        context: {},
        params: { slug },
      });
      const responseBody = await response.json();
      expect(responseBody.parentEvent).toStrictEqual({
        id: "already-parent-id",
        name: "same-parent-name",
        background: null,
      });
      expect(responseBody.parentEventSuggestions).toStrictEqual([
        {
          id: "some-parent-id",
          name: "same-parent-name",
          background: null,
        },
      ]);
      expect(responseBody.childEvents).toStrictEqual([]);
      expect(responseBody.childEventSuggestions).toBe(undefined);
      expect(responseBody.published).toBe(true);
    });

    test("admin user with child autocomplete query", async () => {
      expect.assertions(5);

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

      (prismaClient.event.findUnique as jest.Mock).mockResolvedValueOnce({
        id: "some-event-id",
        published: true,
        childEvents: [
          {
            id: "already-child-id",
            name: "same-child-name",
            background: null,
          },
        ],
        parentEvent: null,
      });

      (prismaClient.event.findFirst as jest.Mock).mockResolvedValueOnce({
        id: "some-event-id",
      });

      (prismaClient.event.findMany as jest.Mock).mockResolvedValueOnce([
        {
          id: "some-child-id",
          name: "same-child-name",
          background: null,
        },
      ]);

      const response = await loader({
        request: new Request(`${testURL}?child_autocomplete_query=same`),
        context: {},
        params: { slug },
      });
      const responseBody = await response.json();
      expect(responseBody.parentEvent).toStrictEqual(null);
      expect(responseBody.parentEventSuggestions).toBe(undefined);
      expect(responseBody.childEvents).toStrictEqual([
        {
          id: "already-child-id",
          name: "same-child-name",
          background: null,
        },
      ]);
      expect(responseBody.childEventSuggestions).toStrictEqual([
        {
          id: "some-child-id",
          name: "same-child-name",
          background: null,
        },
      ]);
      expect(responseBody.published).toBe(true);
    });
  });
});
