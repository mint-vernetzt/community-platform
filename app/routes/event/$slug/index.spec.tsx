import { getSessionUser } from "~/auth.server";
import { testURL } from "~/lib/utils/tests";
import { prismaClient } from "~/prisma";
import { loader } from ".";

// @ts-ignore
const expect = global.expect as jest.Expect;

jest.mock("~/auth.server", () => {
  return {
    ...jest.requireActual("~/auth.server"),
    getSessionUser: jest.fn(),
  };
});

jest.mock("~/lib/utils/application", () => {
  return {
    getFeatureAbilities: jest.fn(),
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
      waitingParticipantOfEvent: { findMany: jest.fn(), findFirst: jest.fn() },
      participantOfEvent: { findMany: jest.fn(), findFirst: jest.fn() },
    },
  };
});

const slug = "slug-test";

describe("/event/$slug", () => {
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

    test("event not found", async () => {
      expect.assertions(2);

      (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
        return null;
      });
      (getSessionUser as jest.Mock).mockImplementationOnce(() => {
        return { id: "some-user-id" };
      });

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

    // test("anon user", async () => {
    //   (getUserByRequest as jest.Mock).mockImplementationOnce(() => {
    //     return null;
    //   });
    //   (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
    //     return { slug, childEvents: [] };
    //   });

    //   const response = await loader({
    //     request: new Request(""),
    //     context: {},
    //     params: { slug },
    //   });

    //   expect(response.mode).toBe("anon");
    //   expect(response.event.slug).toBe(slug);
    // });

    test("anon user (not published)", async () => {
      expect.assertions(2);

      (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
        return { slug, published: false };
      });

      (getSessionUser as jest.Mock).mockImplementationOnce(() => {
        return null;
      });

      const request = new Request(testURL);
      try {
        await loader({ request, context: {}, params: { slug } });
      } catch (error) {
        const response = error as Response;
        expect(response.status).toBe(403);

        const json = await response.json();
        expect(json.message).toBe("Event not published");
      }
    });

    // test("authenticated user", async () => {
    //   (getUserByRequest as jest.Mock).mockImplementationOnce(() => {
    //     return { id: "some-user-id" };
    //   });
    //   (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
    //     return { slug, childEvents: [] };
    //   });
    //   (
    //     prismaClient.teamMemberOfEvent.findFirst as jest.Mock
    //   ).mockImplementationOnce(() => {
    //     return null;
    //   });
    //   (prismaClient.participantOfEvent.findMany as jest.Mock)
    //     .mockImplementation(() => {
    //       return [];
    //     })
    //     .mockImplementation(() => {
    //       return [];
    //     });
    //   (prismaClient.waitingParticipantOfEvent.findMany as jest.Mock)
    //     .mockImplementationOnce(() => {
    //       return [];
    //     })
    //     .mockImplementationOnce(() => {
    //       return [];
    //     });

    //   const response = await loader({
    //     request: new Request(""),
    //     context: {},
    //     params: { slug },
    //   });

    //   expect(response.mode).toBe("authenticated");
    //   expect(response.event.slug).toBe(slug);
    // });

    test("authenticated user (not published)", async () => {
      expect.assertions(2);

      (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
        return { slug, published: false };
      });
      (getSessionUser as jest.Mock).mockImplementationOnce(() => {
        return { id: "some-user-id" };
      });
      (
        prismaClient.teamMemberOfEvent.findFirst as jest.Mock
      ).mockImplementationOnce(() => {
        return { isPrivileged: false };
      });

      const request = new Request(testURL);
      try {
        await loader({ request, context: {}, params: { slug } });
      } catch (error) {
        const response = error as Response;
        expect(response.status).toBe(403);

        const json = await response.json();
        expect(json.message).toBe("Event not published");
      }
    });

    // test("not privileged user ", async () => {
    //   (getUserByRequest as jest.Mock).mockImplementationOnce(() => {
    //     return { id: "some-user-id" };
    //   });
    //   (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
    //     return { slug, childEvents: [] };
    //   });
    //   (
    //     prismaClient.teamMemberOfEvent.findFirst as jest.Mock
    //   ).mockImplementationOnce(() => {
    //     return { isPrivileged: false };
    //   });

    //   const response = await loader({
    //     request: new Request(""),
    //     context: {},
    //     params: { slug },
    //   });

    //   expect(response.mode).toBe("authenticated");
    //   expect(response.event.slug).toBe(slug);
    // });

    // test("privileged user ", async () => {
    //   (getUserByRequest as jest.Mock).mockImplementationOnce(() => {
    //     return { id: "some-user-id" };
    //   });
    //   (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
    //     return { slug };
    //   });
    //   (
    //     prismaClient.teamMemberOfEvent.findFirst as jest.Mock
    //   ).mockImplementationOnce(() => {
    //     return { isPrivileged: true };
    //   });

    //   const response = await loader({
    //     request: new Request(""),
    //     context: {},
    //     params: { slug },
    //   });

    //   expect(response.mode).toBe("owner");
    //   expect(response.event.slug).toBe(slug);
    // });

    // test("privileged user (not published) ", async () => {
    //   (getUserByRequest as jest.Mock).mockImplementationOnce(() => {
    //     return { id: "some-user-id" };
    //   });
    //   (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
    //     return { slug, published: false };
    //   });
    //   (
    //     prismaClient.teamMemberOfEvent.findFirst as jest.Mock
    //   ).mockImplementationOnce(() => {
    //     return { isPrivileged: true };
    //   });

    //   const response = await loader({
    //     request: new Request(""),
    //     context: {},
    //     params: { slug },
    //   });

    //   expect(response.mode).toBe("owner");
    //   expect(response.event.slug).toBe(slug);
    // });
  });
});
