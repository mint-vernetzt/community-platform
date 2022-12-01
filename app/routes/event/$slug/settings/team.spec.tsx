import type { User } from "@supabase/supabase-js";
import * as authServerModule from "~/auth.server";
import { testURL } from "~/lib/utils/tests";
import { prismaClient } from "~/prisma";
import { loader } from "./team";

// @ts-ignore
const expect = global.expect as jest.Expect;

const getSessionUser = jest.spyOn(authServerModule, "getSessionUser");

const slug = "slug-test";

jest.mock("~/prisma", () => {
  return {
    prismaClient: {
      event: {
        findFirst: jest.fn(),
      },
      teamMemberOfEvent: {
        findFirst: jest.fn(),
      },
    },
  };
});

describe("/event/$slug/settings/team", () => {
  describe("loader", () => {
    beforeAll(() => {
      process.env.FEATURES = "events";
    });

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

    test("event not found", async () => {
      expect.assertions(2);

      (prismaClient.event.findFirst as jest.Mock).mockResolvedValue(null);

      getSessionUser.mockResolvedValue({ id: "some-user-id" } as User);

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

    test("anon user", async () => {
      expect.assertions(2);

      getSessionUser.mockResolvedValue(null);

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

    test("authenticated user", async () => {
      expect.assertions(2);

      getSessionUser.mockResolvedValue({ id: "some-user-id" } as User);

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

    test("not privileged user", async () => {
      expect.assertions(2);

      getSessionUser.mockResolvedValue({ id: "some-user-id" } as User);

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
      getSessionUser.mockResolvedValue({ id: "some-user-id" } as User);

      (
        prismaClient.teamMemberOfEvent.findFirst as jest.Mock
      ).mockImplementationOnce(() => {
        return { isPrivileged: true };
      });
      (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
        return {
          slug,
          teamMembers: [
            {
              isPrivileged: true,
              profile: {
                id: "some-user-id",
                firstName: "Some",
                lastName: "User",
                username: "someuser",
              },
            },
            {
              isPrivileged: true,
              profile: {
                id: "another-user-id",
                firstName: "Another",
                lastName: "User",
                username: "anotheruser",
              },
            },
            {
              isPrivileged: false,
              profile: {
                id: "yet-another-user-id",
                firstName: "Yet Another",
                lastName: "User",
                username: "yetanotheruser",
              },
            },
          ],
        };
      });

      const response = await loader({
        request: new Request(testURL),
        context: {},
        params: { slug },
      });

      expect(response.teamMembers.length).toBe(3);
      expect(response.teamMembers).toEqual(
        expect.arrayContaining([
          {
            id: "some-user-id",
            firstName: "Some",
            lastName: "User",
            username: "someuser",
            isPrivileged: true,
            isCurrentUser: true,
          },
          expect.objectContaining({
            id: "yet-another-user-id",
            isPrivileged: false,
            isCurrentUser: false,
          }),
        ])
      );
    });

    afterAll(() => {
      delete process.env.FEATURES;
    });
  });
});
