import type { User } from "@supabase/supabase-js";
import * as authServerModule from "~/auth.server";
import { createRequestWithFormData, testURL } from "~/lib/utils/tests";
import { prismaClient } from "~/prisma.server";
import { action, loader } from "./general";

// @ts-ignore
const expect = global.expect as jest.Expect;

const getSessionUserOrThrow = jest.spyOn(
  authServerModule,
  "getSessionUserOrThrow"
);

jest.mock("~/prisma.server", () => {
  return {
    prismaClient: {
      $transaction: jest.fn(),
      eventVisibility: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      event: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
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
      eventTargetGroup: {
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

const dateTime = "2022-09-19T09:00:00";
const date = new Date(dateTime);
const dbLoaderEvent = {
  id: "some-event-id",
  name: "some-event-name",
  subline: "some-event-subline",
  description: "some-event-description",
  published: false,
  startTime: date,
  endTime: date,
  participationFrom: date,
  participationUntil: date,
  canceled: false,
  venueName: "some-event-venue-name",
  venueStreet: "some-event-venue-street",
  venueStreetNumber: "some-event-venue-street-number",
  venueZipCode: "some-event-venue-zip-code",
  venueCity: "some-event-venue-city",
  conferenceLink: "some-event-conference-link",
  conferenceCode: "some-event-conference-code",
  focuses: [
    {
      focusId: "some-focus-id",
    },
  ],
  eventTargetGroups: [
    {
      eventTargetGroupId: "some-target-group-id",
    },
  ],
  types: [
    {
      eventTypeId: "some-event-type-id",
    },
  ],
  tags: [
    {
      tagId: "some-tag-id",
    },
  ],
  experienceLevel: {
    id: "some-experience-level-id",
  },
  stage: {
    id: "some-stage-id",
  },
  areas: [
    {
      areaId: "some-area-id",
    },
  ],
};

const transformedLoaderEvent = {
  ...dbLoaderEvent,
  startDate: "2022-09-19",
  startTime: "09:00",
  endDate: "2022-09-19",
  endTime: "09:00",
  participationFrom: "2022-09-19T07:00:00.000Z",
  participationUntil: "2022-09-19T07:00:00.000Z",
  participationUntilDate: "2022-09-19",
  participationUntilTime: "09:00",
  participationFromDate: "2022-09-19",
  participationFromTime: "09:00",
  focuses: ["some-focus-id"],
  tags: ["some-tag-id"],
  eventTargetGroups: ["some-target-group-id"],
  types: ["some-event-type-id"],
  areas: ["some-area-id"],
  experienceLevel: "some-experience-level-id",
  stage: "some-stage-id",
};

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
      expect.assertions(1);

      (prismaClient.event.findUnique as jest.Mock).mockResolvedValueOnce(null);

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

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

      (prismaClient.event.findUnique as jest.Mock).mockResolvedValueOnce({
        id: "some-event-id",
      });

      (prismaClient.event.findFirst as jest.Mock).mockResolvedValueOnce(null);

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

    test("admin user", async () => {
      expect.assertions(9);

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

      (prismaClient.event.findUnique as jest.Mock).mockImplementationOnce(
        () => {
          return dbLoaderEvent;
        }
      );

      (
        prismaClient.eventVisibility.findFirst as jest.Mock
      ).mockImplementationOnce(() => {
        return {
          id: "some-event-visibility-id",
          eventId: "some-event-id",
          description: true,
          participants: false,
        };
      });

      (prismaClient.focus.findMany as jest.Mock).mockImplementationOnce(() => {
        return [
          {
            focusId: "some-focus-id",
            focus: {
              id: "some-focus-id",
              title: "some-focus-title",
            },
          },
        ];
      });

      (prismaClient.eventType.findMany as jest.Mock).mockImplementationOnce(
        () => {
          return [
            {
              eventTypeId: "some-event-type-id",
              eventType: {
                id: "some-event-type-id",
                title: "some-event-type-title",
              },
            },
          ];
        }
      );

      (prismaClient.tag.findMany as jest.Mock).mockImplementationOnce(() => {
        return [
          {
            tagId: "some-tag-id",
            tag: {
              id: "some-tag-id",
              title: "some-tag-title",
            },
          },
        ];
      });

      (
        prismaClient.eventTargetGroup.findMany as jest.Mock
      ).mockImplementationOnce(() => {
        return [
          {
            eventTargetGroupId: "some-target-group-id",
            eventTargetGroup: {
              id: "some-target-group-id",
              title: "some-target-group-title",
            },
          },
        ];
      });

      (
        prismaClient.experienceLevel.findMany as jest.Mock
      ).mockImplementationOnce(() => {
        return [
          {
            experienceLevelId: "some-experience-level-id",
            experienceLevel: {
              id: "some-experience-level-id",
              title: "some-experience-level-title",
            },
          },
        ];
      });

      (prismaClient.stage.findMany as jest.Mock).mockImplementationOnce(() => {
        return [
          {
            stageId: "some-stage-id",
            stage: {
              id: "some-stage-id",
              title: "some-stage-title",
            },
          },
        ];
      });

      (prismaClient.area.findMany as jest.Mock).mockImplementationOnce(() => {
        return [
          {
            areaId: "some-area-id",
            area: {
              id: "some-area-id",
              title: "some-area-title",
            },
          },
        ];
      });

      const response = await loader({
        request: new Request(testURL),
        context: {},
        params: { slug },
      });
      const responseBody = await response.json();
      expect(responseBody.event).toStrictEqual(transformedLoaderEvent);
      expect(responseBody.eventVisibilities).toStrictEqual({
        id: "some-event-visibility-id",
        eventId: "some-event-id",
        description: true,
        participants: false,
      });
      expect(responseBody.focuses).toStrictEqual([
        {
          focusId: "some-focus-id",
          focus: {
            id: "some-focus-id",
            title: "some-focus-title",
          },
        },
      ]);
      expect(responseBody.types).toStrictEqual([
        {
          eventTypeId: "some-event-type-id",
          eventType: {
            id: "some-event-type-id",
            title: "some-event-type-title",
          },
        },
      ]);
      expect(responseBody.tags).toStrictEqual([
        {
          tagId: "some-tag-id",
          tag: {
            id: "some-tag-id",
            title: "some-tag-title",
          },
        },
      ]);
      expect(responseBody.eventTargetGroups).toStrictEqual([
        {
          eventTargetGroupId: "some-target-group-id",
          eventTargetGroup: {
            id: "some-target-group-id",
            title: "some-target-group-title",
          },
        },
      ]);
      expect(responseBody.experienceLevels).toStrictEqual([
        {
          experienceLevelId: "some-experience-level-id",
          experienceLevel: {
            id: "some-experience-level-id",
            title: "some-experience-level-title",
          },
        },
      ]);
      expect(responseBody.stages).toStrictEqual([
        {
          stageId: "some-stage-id",
          stage: {
            id: "some-stage-id",
            title: "some-stage-title",
          },
        },
      ]);
      expect(responseBody.areas).toStrictEqual([
        {
          areaId: "some-area-id",
          area: {
            id: "some-area-id",
            title: "some-area-title",
          },
        },
      ]);
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

      expect.assertions(1);

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

      (prismaClient.event.findUnique as jest.Mock).mockResolvedValueOnce(null);

      try {
        await action({ request, context: {}, params: { slug } });
      } catch (error) {
        const response = error as Response;
        expect(response.status).toBe(404);
      }
    });

    test("authenticated user", async () => {
      const request = createRequestWithFormData({ userId: "some-user-id" });

      expect.assertions(1);

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

      (prismaClient.event.findUnique as jest.Mock).mockImplementationOnce(
        () => {
          return {
            id: "some-event-id",
          };
        }
      );
      (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
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
        expect(response.status).toBe(403);
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
        eventTargetGroups: [],
        experienceLevel: "",
        types: [],
        tags: [],
        conferenceLink: "",
        conferenceCode: "",
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
      };

      beforeAll(() => {
        getSessionUserOrThrow.mockResolvedValue({ id: userId } as User);

        (prismaClient.event.findUnique as jest.Mock).mockImplementation(() => {
          return { slug: slug, parentEvent: null, childEvents: [] };
        });
        (prismaClient.event.findFirst as jest.Mock).mockImplementation(() => {
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
        // TODO: fix type issues
        // @ts-ignore
        expect(responseBody.errors.name).toBeDefined();
        // @ts-ignore
        expect(responseBody.errors.name.message).toBe(
          "validation.name.required"
        );
        // @ts-ignore
        expect(responseBody.errors.startDate).toBeDefined();
        // @ts-ignore
        expect(responseBody.errors.startDate.message).toBe(
          "validation.startDate.required"
        );
        // @ts-ignore
        expect(responseBody.errors.endDate).toBeDefined();
        // @ts-ignore
        expect(responseBody.errors.endDate.message).toBe(
          "validation.endDate.required"
        );
        // @ts-ignore
        expect(responseBody.errors.participationUntilDate).toBeDefined();
        // @ts-ignore
        expect(responseBody.errors.participationUntilDate.message).toBe(
          "validation.participationUntilDate.required"
        );
        // @ts-ignore
        expect(responseBody.errors.participationFromDate).toBeDefined();
        // @ts-ignore
        expect(responseBody.errors.participationFromDate.message).toBe(
          "validation.participationFromDate.required"
        );
        // @ts-ignore
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

        // TODO: fix type issues
        // @ts-ignore
        expect(responseBody.errors.startDate).toBeDefined();
        // @ts-ignore
        expect(responseBody.errors.startTime).toBeDefined();
        // @ts-ignore
        expect(responseBody.errors.endDate).toBeDefined();
        // @ts-ignore
        expect(responseBody.errors.endTime).toBeDefined();
        // @ts-ignore
        expect(responseBody.errors.participationUntilDate).toBeDefined();
        // @ts-ignore
        expect(responseBody.errors.participationUntilTime).toBeDefined();
        // @ts-ignore
        expect(responseBody.errors.participationFromDate).toBeDefined();
        // @ts-ignore
        expect(responseBody.errors.participationFromTime).toBeDefined();
        // @ts-ignore
        expect(responseBody.errors.submit).toBeDefined();
        // @ts-ignore
        expect(Object.keys(responseBody.errors).length).toBe(9);
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
        });

        expect.assertions(4);

        const response = await action({
          request: request,
          context: {},
          params: { slug },
        });

        const responseBody = await response.json();

        // TODO: fix type issues
        // @ts-ignore
        expect(responseBody.errors.endTime).toBeDefined();
        // @ts-ignore
        expect(responseBody.errors.participationUntilTime).toBeDefined();
        // @ts-ignore
        expect(responseBody.errors.participationFromDate).toBeDefined();
        // @ts-ignore
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
        });

        expect.assertions(4);

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

        // TODO: fix type issues
        // @ts-ignore
        expect(responseBody.errors.endTime).toBeDefined();
        // @ts-ignore
        expect(responseBody.errors.participationUntilTime).toBeDefined();
        // @ts-ignore
        expect(responseBody.errors.participationFromDate).toBeDefined();
        // @ts-ignore
        expect(Object.keys(responseBody.errors).length).toBe(3);
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
        (prismaClient.event.findUnique as jest.Mock).mockClear();
        (prismaClient.event.findFirst as jest.Mock).mockClear();
      });
    });
  });
});
