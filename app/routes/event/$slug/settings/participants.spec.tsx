import type { User } from "@supabase/supabase-js";
import * as authServerModule from "~/auth.server";
import * as imageServerModule from "~/images.server";
import { createRequestWithFormData, testURL } from "~/lib/utils/tests";
import { prismaClient } from "~/prisma.server";
import { action, loader } from "./participants";

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
        update: jest.fn(),
      },
      profile: {
        findMany: jest.fn(),
      },
      $queryRaw: jest.fn(),
    },
  };
});

jest.mock("~/lib/utils/application", () => {
  return {
    checkFeatureAbilitiesOrThrow: jest.fn(),
  };
});

describe("/event/$slug/settings/participants", () => {
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
      expect.assertions(5);

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

      (prismaClient.event.findUnique as jest.Mock).mockImplementationOnce(
        () => {
          return {
            id: "some-event-id",
            published: false,
            participantLimit: 10,
            participants: [
              {
                createdAt: new Date("2023-09-07T09:00:00"),
                profile: {
                  id: "some-profile-id",
                  username: "some-profile-username",
                  position: "some-profile-position",
                  avatar: null,
                  firstName: "some-profile-first-name",
                  lastName: "some-profile-last-name",
                },
              },
            ],
            waitingList: [
              {
                createdAt: new Date("2023-09-07T09:00:00"),
                profile: {
                  id: "some-profile-id",
                },
              },
            ],
            _count: {
              childEvents: 2,
            },
          };
        }
      );

      (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
        return {
          id: "some-event-id",
        };
      });

      (prismaClient.$queryRaw as jest.Mock).mockImplementationOnce(() => {
        return null;
      });

      const response = await loader({
        request: new Request(testURL),
        context: {},
        params: { slug },
      });

      const responseBody = await response.json();

      expect(responseBody.published).toBe(false);
      expect(responseBody.participantLimit).toBe(10);
      expect(responseBody.participants).toStrictEqual([
        {
          id: "some-profile-id",
          username: "some-profile-username",
          position: "some-profile-position",
          avatar: null,
          firstName: "some-profile-first-name",
          lastName: "some-profile-last-name",
          createdAt: "2023-09-07T07:00:00.000Z",
        },
      ]);
      expect(responseBody.participantSuggestions).toBe(undefined);
      expect(responseBody.hasFullDepthParticipants).toBe(false);
    });

    test("admin user with autocomplete query", async () => {
      expect.assertions(5);

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

      (prismaClient.event.findUnique as jest.Mock).mockImplementationOnce(
        () => {
          return {
            id: "some-event-id",
            published: false,
            participantLimit: 10,
            participants: [
              {
                createdAt: new Date("2023-09-07T09:00:00"),
                profile: {
                  id: "some-profile-id",
                  username: "some-profile-username",
                  position: "some-profile-position",
                  avatar: "some-profile-avatar-path",
                  firstName: "some-profile-first-name",
                  lastName: "some-profile-last-name",
                },
              },
            ],
            waitingList: [
              {
                createdAt: new Date("2023-09-07T09:00:00"),
                profile: {
                  id: "some-profile-id",
                },
              },
            ],
            _count: {
              childEvents: 0,
            },
          };
        }
      );

      (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
        return {
          id: "some-event-id",
        };
      });

      getImageURL.mockImplementationOnce(() => "some-profile-avatar-image-url");

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

      (prismaClient.$queryRaw as jest.Mock).mockImplementationOnce(() => {
        return [
          {
            id: "full-depth-profile-id",
            firstName: "full-depth-profile-first-name",
            lastName: "full-depth-profile-last-name",
            username: "full-depth-profile-username",
            position: "full-depth-profile-position",
            avatar: "full-depth-profile-avatar-path",
            academicTitle: "full-depth-profile-academic-title",
          },
        ];
      });

      const response = await loader({
        request: new Request(`${testURL}?autocomplete_query=suggested`),
        context: {},
        params: { slug },
      });

      const responseBody = await response.json();

      expect(responseBody.published).toBe(false);
      expect(responseBody.participantLimit).toBe(10);
      expect(responseBody.participants).toStrictEqual([
        {
          id: "some-profile-id",
          username: "some-profile-username",
          position: "some-profile-position",
          avatar: "some-profile-avatar-image-url",
          firstName: "some-profile-first-name",
          lastName: "some-profile-last-name",
          createdAt: "2023-09-07T07:00:00.000Z",
        },
      ]);
      expect(responseBody.participantSuggestions).toStrictEqual([
        {
          id: "suggested-profile-id",
          firstName: "suggested-profile-first-name",
          lastName: "suggested-profile-last-name",
          avatar: "suggested-profile-avatar-image-url",
          position: "suggested-profile-position",
        },
      ]);
      expect(responseBody.hasFullDepthParticipants).toBe(false);
    });
  });

  describe("action", () => {
    test("no params", async () => {
      expect.assertions(2);
      const request = createRequestWithFormData({});
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
      expect.assertions(2);
      const request = createRequestWithFormData({});

      try {
        await action({
          request: request,
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
      const request = createRequestWithFormData({});

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

      (prismaClient.event.findUnique as jest.Mock).mockResolvedValueOnce(null);

      try {
        await loader({ request, context: {}, params: { slug } });
      } catch (error) {
        const response = error as Response;
        expect(response.status).toBe(404);
      }
    });

    test("authenticated user", async () => {
      expect.assertions(1);
      const request = createRequestWithFormData({});

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

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
          request,
          context: {},
          params: { slug },
        });
      } catch (error) {
        const response = error as Response;
        expect(response.status).toBe(403);
      }
    });

    test("participant limit not a number", async () => {
      expect.assertions(1);
      const request = createRequestWithFormData({
        participantLimit: "not a number",
      });

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

      (prismaClient.event.findUnique as jest.Mock).mockImplementationOnce(
        () => {
          return {
            id: "some-event-id",
            _count: {
              participants: 5,
            },
          };
        }
      );

      (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
        return {
          id: "some-event-id",
        };
      });

      const response = await action({
        request: request,
        context: {},
        params: { slug },
      });

      const responseBody = await response.json();
      expect(responseBody.errors.participantLimit).toStrictEqual(["Invalid"]);
    });

    test("participant limit less than already participating", async () => {
      expect.assertions(1);
      const request = createRequestWithFormData({
        participantLimit: "2",
      });

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

      (prismaClient.event.findUnique as jest.Mock).mockImplementationOnce(
        () => {
          return {
            id: "some-event-id",
            _count: {
              participants: 5,
            },
          };
        }
      );

      (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
        return {
          id: "some-event-id",
        };
      });

      const response = await action({
        request: request,
        context: {},
        params: { slug },
      });

      const responseBody = await response.json();
      expect(responseBody.errors.participantLimit).toStrictEqual([
        "error.inputError",
      ]);
    });

    test("update participant limit with empty string", async () => {
      // expect.assertions(1);
      const request = createRequestWithFormData({
        participantLimit: "",
      });

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

      (prismaClient.event.findUnique as jest.Mock).mockImplementationOnce(
        () => {
          return {
            id: "some-event-id",
            _count: {
              participants: 5,
            },
          };
        }
      );

      (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
        return {
          id: "some-event-id",
        };
      });

      await action({
        request: request,
        context: {},
        params: { slug },
      });
      expect(prismaClient.event.update).toHaveBeenCalledWith({
        data: { participantLimit: null },
        where: { slug: "slug-test" },
      });
    });

    test("update participant limit", async () => {
      // expect.assertions(1);
      const request = createRequestWithFormData({
        participantLimit: "10",
      });

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

      (prismaClient.event.findUnique as jest.Mock).mockImplementationOnce(
        () => {
          return {
            id: "some-event-id",
            _count: {
              participants: 5,
            },
          };
        }
      );

      (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
        return {
          id: "some-event-id",
        };
      });

      await action({
        request: request,
        context: {},
        params: { slug },
      });
      expect(prismaClient.event.update).toHaveBeenCalledWith({
        data: { participantLimit: 10 },
        where: { slug: "slug-test" },
      });
    });
  });
});
