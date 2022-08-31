import { User } from "@supabase/supabase-js";
import * as authServerModule from "~/auth.server";
import { prismaClient } from "~/prisma";
import { loader } from "./speakers";

// @ts-ignore
const expect = global.expect as jest.Expect;

const getUserByRequest = jest.spyOn(authServerModule, "getUserByRequest");

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

describe("/event/$slug/settings/speakers", () => {
  describe("loader", () => {
    beforeAll(() => {
      process.env.FEATURES = "events";
    });

    test("no params", async () => {
      expect.assertions(2);

      const request = new Request("");
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

      getUserByRequest.mockResolvedValue({ id: "some-user-id" } as User);

      const request = new Request("");
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

      getUserByRequest.mockResolvedValue(null);

      try {
        await loader({
          request: new Request(""),
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

      getUserByRequest.mockResolvedValue({ id: "some-user-id" } as User);

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
          request: new Request(""),
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
      getUserByRequest.mockResolvedValue({ id: "some-user-id" } as User);

      (
        prismaClient.teamMemberOfEvent.findFirst as jest.Mock
      ).mockImplementationOnce(() => {
        return { isPrivileged: true };
      });
      (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
        return {
          slug,
          speakers: [
            {
              profile: {
                id: "some-user-id",
                firstName: "Some",
                lastName: "User",
                username: "someuser",
              },
            },
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
        request: new Request(""),
        context: {},
        params: { slug },
      });

      expect(response.speakers.length).toBe(3);
      expect(response.speakers).toEqual(
        expect.arrayContaining([
          {
            id: "some-user-id",
            firstName: "Some",
            lastName: "User",
            username: "someuser",
          },
          expect.objectContaining({
            id: "yet-another-user-id",
          }),
        ])
      );
    });

    afterAll(() => {
      delete process.env.FEATURES;
    });
  });
});
