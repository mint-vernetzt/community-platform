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
      focus: {
        findMany: jest.fn(),
      },
      area: {
        findMany: jest.fn(),
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
      const dateTime = "2022-09-19T09:00:00";
      const date = new Date(dateTime);

      getUserByRequest.mockResolvedValue({ id: "some-user-id" } as User);

      (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
        return {
          slug,
          startTime: date,
          endTime: date,
          participationUntil: date,
          focuses: [],
          areas: [],
        };
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
      expect(response.userId).toBe("some-user-id");
      expect(response.event.slug).toBe(slug);
      expect(response.event.startDate).toBe("2022-09-19");
      expect(response.event.startTime).toBe("09:00");
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

    describe("privileged user", () => {
      const id = "some-user-id";

      const formDefaults = {
        id,
        name: "",
        startDate: "",
        startTime: "",
        endDate: "",
        endTime: "",
        description: "",
        published: "off",
        updatedAt: "",
        focuses: [],
        targetGroups: [],
        experienceLevel: "",
        types: [],
        tags: [],
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

      beforeAll(() => {
        getUserByRequest.mockResolvedValue({ id } as User);

        (prismaClient.event.findFirst as jest.Mock).mockImplementation(() => {
          return { slug };
        });
        (
          prismaClient.teamMemberOfEvent.findFirst as jest.Mock
        ).mockImplementation(() => {
          return { slug };
        });
      });

      test("all fields required", async () => {
        const request = createRequestWithFormData({
          id: "some-user-id",
          name: "Event title",
        });
        expect.assertions(2);

        try {
          await action({ request, context: {}, params: { slug } });
        } catch (error) {
          const response = error as Response;
          expect(response.status).toBe(400);

          const json = await response.json();
          expect(json.message).toBe("Validation failed");
        }
      });

      test("validate required fields", async () => {
        const requestWithDefaultValues = createRequestWithFormData({
          ...formDefaults,
        });

        const response = await action({
          request: requestWithDefaultValues,
          context: {},
          params: { slug },
        });
        expect(response.errors.name).toBeDefined();
        expect(response.errors.name.message).toBe(
          "Bitte gib den Namen der Veranstaltung an"
        );
        expect(response.errors.startDate).toBeDefined();
        expect(response.errors.startDate.message).toBe(
          "Bitte gib den Beginn der Veranstaltung an"
        );
        expect(response.errors.endDate).toBeDefined();
        expect(response.errors.endDate.message).toBe(
          "Bitte gib das Ende der Veranstaltung an"
        );
        expect(response.errors.participationUntilDate).toBeDefined();
        expect(response.errors.participationUntilDate.message).toBe(
          "Bitte gib das Ende für die Registrierung an"
        );
        expect(response.errors.submit).toBeDefined();
        // expect(Object.keys(response.errors).length).toBe(3);
      });

      test("validate date time fields", async () => {
        const requestWithInvalidDateTimeValues = createRequestWithFormData({
          ...formDefaults,
          name: "Some Event",
          startDate: "2022x09x19",
          startTime: "0900",
          endDate: "20.09.2022",
          endTime: "18:00:01",
          participationUntilDate: "2022|09|12",
          participationUntilTime: "11:59pm",
        });

        const responseInvalidDateTimeValues = await action({
          request: requestWithInvalidDateTimeValues,
          context: {},
          params: { slug },
        });

        expect(responseInvalidDateTimeValues.errors.startDate).toBeDefined();
        expect(responseInvalidDateTimeValues.errors.startTime).toBeDefined();
        expect(responseInvalidDateTimeValues.errors.endDate).toBeDefined();
        expect(responseInvalidDateTimeValues.errors.endTime).toBeDefined();
        expect(
          responseInvalidDateTimeValues.errors.participationUntilDate
        ).toBeDefined();
        expect(
          responseInvalidDateTimeValues.errors.participationUntilTime
        ).toBeDefined();
        expect(responseInvalidDateTimeValues.errors.submit).toBeDefined();
        expect(Object.keys(responseInvalidDateTimeValues.errors).length).toBe(
          7
        );

        const requestWithValidDateTimeValues = createRequestWithFormData({
          ...formDefaults,
          name: "Some Event",
          startDate: "2022-09-19",
          startTime: "09:00",
          endDate: "2022-09-20",
          endTime: "18:00",
          participationUntilDate: "2022-09-12",
          participationUntilTime: "23:59",
        });
        const responseValidDateTimeValues = await action({
          request: requestWithValidDateTimeValues,
          context: {},
          params: { slug },
        });

        expect(responseValidDateTimeValues.errors.submit).toBeDefined();
        expect(Object.keys(responseValidDateTimeValues.errors).length).toBe(1);
      });

      test("add list item", async () => {
        const listAction = "addFocuse"; // TODO: improve singular name thing
        const listActionItemId = "2";

        const request = createRequestWithFormData({
          ...formDefaults,
          submit: listAction,
          name: "Some Event",
          startDate: "2022-09-19",
          startTime: "09:00",
          endDate: "2022-09-20",
          endTime: "18:00",
          participationUntilDate: "2022-09-12",
          participationUntilTime: "23:59",
          [listAction]: listActionItemId,
        });
        const response = await action({
          request,
          context: {},
          params: { slug: slug },
        });

        expect(response.errors).toBeNull();
        expect(response.data.focuses).toEqual([listActionItemId]);
      });

      afterAll(() => {
        getUserByRequest.mockClear();
        (prismaClient.event.findFirst as jest.Mock).mockClear();
        (prismaClient.teamMemberOfEvent.findFirst as jest.Mock).mockClear();
      });
    });

    afterAll(() => {
      delete process.env.FEATURES;
    });
  });
});
