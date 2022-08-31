import { User } from "@supabase/supabase-js";
import * as authServerModule from "~/auth.server";
import { prismaClient } from "~/prisma";
import { loader } from "./organizations";

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

describe("/event/$slug/settings/organizations", () => {
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

  test("authenticated user", async () => {
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

  afterAll(() => {
    delete process.env.FEATURES;
  });
});
