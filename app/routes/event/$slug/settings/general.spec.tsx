import { getUserByRequest } from "~/auth.server";
import { prismaClient } from "~/prisma";
import { loader } from "./general";

// @ts-ignore
const expect = global.expect as jest.Expect;

jest.mock("~/auth.server", () => {
  return {
    getUserByRequest: jest.fn(),
  };
});

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

const slug = "slug-test";

describe("/event/$slug/settings/general", () => {
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
  });

  test("event not found", async () => {
    expect.assertions(2);

    (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
      return null;
    });
    (getUserByRequest as jest.Mock).mockImplementationOnce(() => {
      return { id: "some-user-id" };
    });

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

    (getUserByRequest as jest.Mock).mockImplementationOnce(() => {
      return null;
    });
    (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
      return { slug };
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
      expect(json.message).toBe("Not authorized");
    }
  });

  test("authenticated user", async () => {
    expect.assertions(2);

    (getUserByRequest as jest.Mock).mockImplementationOnce(() => {
      return { id: "some-user-id" };
    });
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
      expect(json.message).toBe("Not authorized");
    }
  });

  test("not privileged user", async () => {
    expect.assertions(2);

    (getUserByRequest as jest.Mock).mockImplementationOnce(() => {
      return { id: "some-user-id" };
    });
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
      expect(json.message).toBe("Not authorized");
    }
  });

  test("privileged user", async () => {
    (getUserByRequest as jest.Mock).mockImplementationOnce(() => {
      return { id: "some-user-id" };
    });
    (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
      return { slug };
    });
    (
      prismaClient.teamMemberOfEvent.findFirst as jest.Mock
    ).mockImplementationOnce(() => {
      return { isPrivileged: true };
    });

    const response = await loader({
      request: new Request(""),
      context: {},
      params: { slug },
    });
    expect(response.event.slug).toBe(slug);
  });

  afterAll(() => {
    delete process.env.FEATURES;
  });
});
