import type { User } from "@supabase/supabase-js";
import * as authServerModule from "~/auth.server";
import { createRequestWithFormData, testURL } from "~/lib/utils/tests";
import { prismaClient } from "~/prisma";
import { action, loader } from "./general";

// @ts-ignore
const expect = global.expect as jest.Expect;

const getSessionUserOrThrow = jest.spyOn(
  authServerModule,
  "getSessionUserOrThrow"
);

jest.mock("~/prisma", () => {
  return {
    prismaClient: {
      $transaction: jest.fn(),
      eventVisibility: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      event: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      teamMemberOfEvent: {
        findFirst: jest.fn(),
      },
      focus: {
        findMany: jest.fn(),
      },
      tag: {
        findMany: jest.fn(),
      },
      experienceLevel: {
        findMany: jest.fn(),
      },
      stage: {
        findMany: jest.fn(),
      },
      targetGroup: {
        findMany: jest.fn(),
      },
      eventType: {
        findMany: jest.fn(),
      },
      area: {
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

const slug = "slug-test";

describe("/event/$slug/settings/general", () => {
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
      expect.assertions(2);

      (prismaClient.event.findFirst as jest.Mock).mockResolvedValueOnce(null);

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

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

    test("authenticated user", async () => {
      expect.assertions(2);

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

      (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
        return { slug };
      });
      (
        prismaClient.eventVisibility.findFirst as jest.Mock
      ).mockImplementationOnce(() => {
        return { slug: true };
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

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

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
      expect.assertions(4);
      const dateTime = "2022-09-19T09:00:00";
      const date = new Date(dateTime);

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

      (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
        return {
          slug,
          startTime: date,
          endTime: date,
          participationFrom: date,
          participationUntil: date,
          focuses: [],
          targetGroups: [],
          types: [],
          tags: [],
          experienceLevels: [],
          stages: [],
          areas: [],
        };
      });
      (
        prismaClient.teamMemberOfEvent.findFirst as jest.Mock
      ).mockImplementationOnce(() => {
        return { isPrivileged: true };
      });

      const response = await loader({
        request: new Request(testURL),
        context: {},
        params: { slug },
      });
      const responseBody = await response.json();
      // TODO: Add expects (loader does return more than that)
      expect(responseBody.userId).toBe("some-user-id");
      expect(responseBody.event.slug).toBe(slug);
      expect(responseBody.event.startDate).toBe("2022-09-19");
      expect(responseBody.event.startTime).toBe("09:00");
    });
  });

  describe("action", () => {
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

    test("anon user", async () => {
      const request = createRequestWithFormData({});

      expect.assertions(2);

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

    test("event not found", async () => {
      const request = createRequestWithFormData({ userId: "some-user-id" });

      expect.assertions(2);

      (prismaClient.event.findFirst as jest.Mock).mockResolvedValueOnce(null);

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

      try {
        await action({ request, context: {}, params: { slug } });
      } catch (error) {
        const response = error as Response;
        expect(response.status).toBe(404);

        const json = await response.json();
        expect(json.message).toBe("Event not found");
      }
    });

    test("authenticated user", async () => {
      const request = createRequestWithFormData({ userId: "some-user-id" });

      expect.assertions(2);

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

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
      const request = createRequestWithFormData({ userId: "some-user-id" });

      expect.assertions(2);

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

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

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "another-user-id",
      } as User);

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
      const userId = "some-user-id";

      const formDefaults = {
        userId,
        name: "",
        startDate: "",
        startTime: "",
        endDate: "",
        endTime: "",
        subline: "",
        description: "",
        canceled: "off",
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
        participationFromDate: "",
        participationFromTime: "",
        areas: [],
        venueName: "",
        venueStreet: "",
        venueStreetNumber: "",
        venueCity: "",
        venueZipCode: "",
        submit: "",
        participantCount: "",
      };

      beforeAll(() => {
        getSessionUserOrThrow.mockResolvedValue({ id: userId } as User);

        (prismaClient.event.findFirst as jest.Mock).mockImplementation(() => {
          return { slug: slug, parentEvent: null, childEvents: [] };
        });
        (
          prismaClient.teamMemberOfEvent.findFirst as jest.Mock
        ).mockImplementation(() => {
          return { slug };
        });
      });

      test("all fields required", async () => {
        const request = createRequestWithFormData({
          userId: "some-user-id",
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

        expect.assertions(11);

        const response = await action({
          request: requestWithDefaultValues,
          context: {},
          params: { slug },
        });
        const responseBody = await response.json();
        expect(responseBody.errors.name).toBeDefined();
        expect(responseBody.errors.name.message).toBe(
          "Bitte gib den Namen der Veranstaltung an"
        );
        expect(responseBody.errors.startDate).toBeDefined();
        expect(responseBody.errors.startDate.message).toBe(
          "Bitte gib den Beginn der Veranstaltung an"
        );
        expect(responseBody.errors.endDate).toBeDefined();
        expect(responseBody.errors.endDate.message).toBe(
          "Bitte gib das Ende der Veranstaltung an"
        );
        expect(responseBody.errors.participationUntilDate).toBeDefined();
        expect(responseBody.errors.participationUntilDate.message).toBe(
          "Bitte gib das Ende für die Registrierung an"
        );
        expect(responseBody.errors.participationFromDate).toBeDefined();
        expect(responseBody.errors.participationFromDate.message).toBe(
          "Bitte gib den Beginn für die Registrierung an"
        );
        expect(responseBody.errors.submit).toBeDefined();
        // expect(Object.keys(response.errors).length).toBe(3);
      });

      test("invalid date time fields (format)", async () => {
        const request = createRequestWithFormData({
          ...formDefaults,
          name: "Some Event",
          startDate: "2022x09x19",
          startTime: "0900",
          endDate: "20.09.2022",
          endTime: "18:00:01",
          participationUntilDate: "2022|09|12",
          participationUntilTime: "11:59pm",
          participationFromDate: "2022|09|12",
          participationFromTime: "11:50pm",
        });

        expect.assertions(10);

        const response = await action({
          request: request,
          context: {},
          params: { slug },
        });

        const responseBody = await response.json();

        expect(responseBody.errors.startDate).toBeDefined();
        expect(responseBody.errors.startTime).toBeDefined();
        expect(responseBody.errors.endDate).toBeDefined();
        expect(responseBody.errors.endTime).toBeDefined();
        expect(responseBody.errors.participationUntilDate).toBeDefined();
        expect(responseBody.errors.participationUntilTime).toBeDefined();
        expect(responseBody.errors.participationFromDate).toBeDefined();
        expect(responseBody.errors.participationFromTime).toBeDefined();
        expect(responseBody.errors.submit).toBeDefined();
        expect(Object.keys(responseBody.errors).length).toBe(10);
      });

      test("invalid date time fields (end before start)", async () => {
        const request = createRequestWithFormData({
          ...formDefaults,
          name: "Some Event",
          startDate: "2022-09-20",
          startTime: "09:00",
          endDate: "2022-09-20",
          endTime: "09:00",
          participationUntilDate: "2022-09-21",
          participationUntilTime: "23:00",
          participationFromDate: "2022-09-21",
          participationFromTime: "23:00",
          submit: "submit",
          participantCount: "0",
        });

        expect.assertions(4);

        const response = await action({
          request: request,
          context: {},
          params: { slug },
        });

        const responseBody = await response.json();

        expect(responseBody.errors.endTime).toBeDefined();
        expect(responseBody.errors.participationUntilTime).toBeDefined();
        expect(responseBody.errors.participationFromDate).toBeDefined();
        expect(Object.keys(responseBody.errors).length).toBe(3);
      });
      test("invalid date time fields (not inside parent/child event time span)", async () => {
        const request = createRequestWithFormData({
          ...formDefaults,
          name: "Some Event",
          startDate: "2022-09-20",
          startTime: "09:00",
          endDate: "2022-09-20",
          endTime: "09:00",
          participationUntilDate: "2022-09-21",
          participationUntilTime: "23:00",
          participationFromDate: "2022-09-21",
          participationFromTime: "23:00",
          submit: "submit",
          participantCount: "0",
        });

        expect.assertions(5);

        (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(
          () => {
            return {
              slug: slug,
              parentEvent: {
                startTime: new Date("2022-09-30 07:00Z"),
                endTime: new Date("2022-10-10 07:00Z"),
              },
              childEvents: [
                {
                  startTime: new Date("2022-10-01 07:00Z"),
                  endTime: new Date("2022-10-02 07:00Z"),
                },
              ],
            };
          }
        );

        const response = await action({
          request: request,
          context: {},
          params: { slug },
        });

        const responseBody = await response.json();

        expect(responseBody.errors.endTime).toBeDefined();
        expect(responseBody.errors.participationUntilTime).toBeDefined();
        expect(responseBody.errors.participationFromDate).toBeDefined();
        expect(responseBody.errors.endDate).toBeDefined();
        expect(Object.keys(responseBody.errors).length).toBe(4);
      });
      test("valid update call of event settings general", async () => {
        const request = createRequestWithFormData({
          ...formDefaults,
          name: "Some Event",
          startDate: "2022-09-19",
          startTime: "09:00",
          endDate: "2022-09-20",
          endTime: "18:00",
          participationUntilDate: "2022-09-12",
          participationUntilTime: "23:59",
          participationFromDate: "2022-09-12",
          participationFromTime: "23:00",
          submit: "submit",
          participantCount: "0",
        });
        (
          prismaClient.eventVisibility.findFirst as jest.Mock
        ).mockImplementationOnce(() => {
          return { slug: true };
        });
        const response = await action({
          request: request,
          context: {},
          params: { slug },
        });

        const responseBody = await response.json();

        expect(responseBody.errors).toBe(null);
      });

      test("add list item", async () => {
        expect.assertions(2);
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
          participationFromDate: "2022-09-12",
          participationFromTime: "23:00",
          participantCount: "0",
          [listAction]: listActionItemId,
        });
        const response = await action({
          request,
          context: {},
          params: { slug: slug },
        });
        const responseBody = await response.json();

        expect(responseBody.errors).toBeNull();
        expect(responseBody.data.focuses).toEqual([listActionItemId]);
      });

      afterAll(() => {
        getSessionUserOrThrow.mockClear();
        (prismaClient.event.findFirst as jest.Mock).mockClear();
        (prismaClient.teamMemberOfEvent.findFirst as jest.Mock).mockClear();
      });
    });
  });
});
