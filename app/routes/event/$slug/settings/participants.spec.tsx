import type { User } from "@supabase/supabase-js";
import * as authServerModule from "~/auth.server";
import { testURL } from "~/lib/utils/tests";
import { prismaClient } from "~/prisma";
import { loader } from "./participants";

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

describe("/event/$slug/settings/participants", () => {
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
          participantLimit: 1,
          participants: [
            {
              profile: {
                id: "some-user-id",
                firstName: "Some",
                lastName: "User",
                username: "someuser",
              },
            },
          ],
          waitingList: [
            {
              profile: {
                id: "another-user-id",
                firstName: "Another",
                lastName: "User",
                username: "anotheruser",
              },
            },
            {
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

      expect(response.participants.length).toBe(1);
      expect(response.participants).toEqual([
        {
          id: "some-user-id",
          firstName: "Some",
          lastName: "User",
          username: "someuser",
        },
      ]);
      expect(response.participantLimit).toBe(1);
      expect(response.waitingList.length).toBe(2);
      expect(response.waitingList).toEqual([
        {
          id: "another-user-id",
          firstName: "Another",
          lastName: "User",
          username: "anotheruser",
        },
        {
          id: "yet-another-user-id",
          firstName: "Yet Another",
          lastName: "User",
          username: "yetanotheruser",
        },
      ]);
    });

    afterAll(() => {
      delete process.env.FEATURES;
    });
  });
});
