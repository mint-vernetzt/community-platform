import { User } from "@supabase/supabase-js";
import * as authServerModule from "~/auth.server";
import { createRequestWithFormData } from "~/lib/utils/tests";
import { prismaClient } from "~/prisma";
import { action, loader } from "./general";

// @ts-ignore
const expect = global.expect as jest.Expect;

const getUserByRequest = jest.spyOn(authServerModule, "getUserByRequest");

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
  const formDefaults = {
    id: "",
    name: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    description: "",
    published: "",
    updatedAt: "",
    focuses: "",
    targetGroups: "",
    experienceLevel: "",
    types: "",
    tags: "",
    conferenceLink: "",
    conferenceCode: "",
    participantLimit: "",
    participationUntilDate: "",
    participationUntilTime: "",
    areas: [],
    venueName: "",
    venueStreet: "",
    venueStreetNumber: "",
    venueCity: "",
    venueZipCode: "",
  };

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

  describe("action", () => {
    beforeAll(() => {
      process.env.FEATURES = "events";
    });

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

    test("event not found", async () => {
      const request = createRequestWithFormData({ id: "some-user-id" });

      expect.assertions(2);

      (prismaClient.event.findFirst as jest.Mock).mockResolvedValue(null);

      getUserByRequest.mockResolvedValue({ id: "some-user-id" } as User);

      try {
        await action({ request, context: {}, params: { slug } });
      } catch (error) {
        const response = error as Response;
        expect(response.status).toBe(404);

        const json = await response.json();
        expect(json.message).toBe("Event not found");
      }
    });

    test("anon user", async () => {
      const request = createRequestWithFormData({});

      expect.assertions(2);

      getUserByRequest.mockResolvedValue(null);

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

    test("authenticated user", async () => {
      const request = createRequestWithFormData({ id: "some-user-id" });

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

    test("not privileged user", async () => {
      const request = createRequestWithFormData({ id: "some-user-id" });

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
      const request = createRequestWithFormData({ id: "some-user-id" });

      expect.assertions(2);

      getUserByRequest.mockResolvedValue({ id: "another-user-id" } as User);

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

    test("all fields required", async () => {
      const request = createRequestWithFormData({
        id: "some-user-id",
        name: "Event title",
      });
      expect.assertions(2);

      getUserByRequest.mockResolvedValue({ id: "some-user-id" } as User);

      (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
        return { slug };
      });
      (
        prismaClient.teamMemberOfEvent.findFirst as jest.Mock
      ).mockImplementationOnce(() => {
        return { slug };
      });

      try {
        await action({ request, context: {}, params: { slug } });
      } catch (error) {
        const response = error as Response;
        expect(response.status).toBe(400);

        const json = await response.json();

        console.log(json.message);

        expect(json.message).toBe("Validation failed");
      }
    });

    afterAll(() => {
      delete process.env.FEATURES;
    });
  });
});
