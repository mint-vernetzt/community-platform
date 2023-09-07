import type { User } from "@supabase/supabase-js";
import * as authServerModule from "~/auth.server";
import { testURL } from "~/lib/utils/tests";
import { prismaClient } from "~/prisma.server";
import { loader } from "./team";
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
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
      profile: {
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

describe("/event/$slug/settings/team", () => {
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

      getSessionUserOrThrow.mockResolvedValue({ id: "some-user-id" } as User);

      (prismaClient.event.findUnique as jest.Mock).mockResolvedValue(null);

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

      getSessionUserOrThrow.mockResolvedValue({ id: "some-user-id" } as User);

      (prismaClient.event.findUnique as jest.Mock).mockImplementationOnce(
        () => {
          return { slug };
        }
      );

      (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
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
        expect(response.status).toBe(403);
      }
    });

    test("admin user without autocomplete query", async () => {
      expect.assertions(3);
      getSessionUserOrThrow.mockResolvedValue({ id: "some-user-id" } as User);

      (prismaClient.event.findUnique as jest.Mock).mockImplementationOnce(
        () => {
          return {
            id: "some-event-id",
            published: true,
            teamMembers: [
              {
                profile: {
                  id: "some-user-id",
                  avatar: null,
                  firstName: "Some",
                  lastName: "User",
                  username: "someuser",
                  postion: "some-user-position",
                },
              },
            ],
          };
        }
      );

      (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
        return {
          id: "some-event-id",
        };
      });

      const response = await loader({
        request: new Request(testURL),
        context: {},
        params: { slug },
      });

      const responseBody = await response.json();

      expect(responseBody.published).toBe(true);
      expect(responseBody.teamMembers).toStrictEqual([
        {
          id: "some-user-id",
          avatar: null,
          firstName: "Some",
          lastName: "User",
          username: "someuser",
          postion: "some-user-position",
        },
      ]);
      expect(responseBody.speakerSuggestions).toBe(undefined);
    });

    test("admin user with autocomplete query", async () => {
      expect.assertions(3);
      getSessionUserOrThrow.mockResolvedValue({ id: "some-user-id" } as User);

      (prismaClient.event.findUnique as jest.Mock).mockImplementationOnce(
        () => {
          return {
            id: "some-event-id",
            published: true,
            teamMembers: [
              {
                profile: {
                  id: "some-user-id",
                  avatar: "some-user-avatar-path",
                  firstName: "Some",
                  lastName: "User",
                  username: "someuser",
                  postion: "some-user-position",
                },
              },
            ],
          };
        }
      );

      (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
        return {
          id: "some-event-id",
        };
      });

      getImageURL.mockImplementationOnce(() => "some-user-avatar-image-url");

      (prismaClient.profile.findMany as jest.Mock).mockImplementationOnce(
        () => {
          return [
            {
              id: "suggested-profile-id",
              firstName: "suggested-profile-first-name",
              lastName: "suggested-profile-last-name",
              avatar: "suggested-profile-avatar-path",
              position: "suggested-profile-position",
            },
          ];
        }
      );

      getImageURL.mockImplementationOnce(
        () => "suggested-profile-avatar-image-url"
      );

      const response = await loader({
        request: new Request(`${testURL}?autocomplete_query=suggested`),
        context: {},
        params: { slug },
      });

      const responseBody = await response.json();

      expect(responseBody.published).toBe(true);
      expect(responseBody.teamMembers).toStrictEqual([
        {
          id: "some-user-id",
          avatar: "some-user-avatar-image-url",
          firstName: "Some",
          lastName: "User",
          username: "someuser",
          postion: "some-user-position",
        },
      ]);
      expect(responseBody.teamMemberSuggestions).toStrictEqual([
        {
          id: "suggested-profile-id",
          firstName: "suggested-profile-first-name",
          lastName: "suggested-profile-last-name",
          avatar: "suggested-profile-avatar-image-url",
          position: "suggested-profile-position",
        },
      ]);
    });
  });
});
