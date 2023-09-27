import { getSessionUser } from "~/auth.server";
import { testURL } from "~/lib/utils/tests";
import { prismaClient } from "~/prisma.server";
import { loader } from ".";
import * as imageServerModule from "~/images.server";
import { redirect } from "@remix-run/node";

// @ts-ignore
const expect = global.expect as jest.Expect;

const getImageURL = jest.spyOn(imageServerModule, "getImageURL");

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

jest.mock("~/prisma.server", () => {
  return {
    prismaClient: {
      $queryRaw: jest.fn(),
      event: {
        findFirst: jest.fn(),
      },
      profile: {
        findFirst: jest.fn(),
      },
      speakerOfEvent: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      participantOfEvent: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      waitingParticipantOfEvent: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      teamMemberOfEvent: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      eventVisibility: {
        findFirst: jest.fn(),
      },
      profileVisibility: {
        findFirst: jest.fn(),
      },
      organizationVisibility: {
        findFirst: jest.fn(),
      },
    },
  };
});

const slug = "slug-test";

const fullPublishedEvent = {
  id: "some-event-id",
  slug: "some-event-slug",
  published: true,
  background: null,
  name: "some-event-name",
  startTime: new Date("2022-09-19T09:00:00"),
  endTime: new Date("2022-09-19T09:00:00"),
  venueName: "some-event-venue-name",
  venueStreet: "some-event-venue-street",
  venueStreetNumber: "some-event-venue-street-number",
  venueZipCode: "some-event-venue-zip-code",
  venueCity: "some-event-venue-city",
  conferenceLink: "some-event-conference-link",
  conferenceCode: "some-event-conference-code",
  subline: "some-event-subline",
  participationUntil: new Date("2022-09-19T09:00:00"),
  participationFrom: new Date("2022-09-19T09:00:00"),
  participantLimit: 10,
  description: "some-event-description",
  canceled: false,
  stage: {
    id: "some-stage-id",
    title: "some-stage-title",
    slug: "some-stage-slug",
  },
  parentEvent: {
    id: "some-parent-id",
    slug: "some-parent-slug",
    name: "some-parent-name",
  },
  areas: [
    {
      area: {
        name: "some-area-name",
      },
    },
  ],
  types: [
    {
      eventType: {
        title: "some-event-type-title",
      },
    },
  ],
  tags: [
    {
      tag: {
        title: "some-tag-title",
      },
    },
  ],
  focuses: [
    {
      focus: {
        title: "some-focus-title",
      },
    },
  ],
  targetGroups: [
    {
      targetGroup: {
        title: "some-target-group-title",
      },
    },
  ],
  experienceLevel: {
    title: "some-experience-level-title",
  },
  responsibleOrganizations: [
    {
      organization: {
        id: "some-organization-id",
        slug: "some-organization-slug",
        logo: null,
        name: "some-organization-name",
        types: [
          {
            organizationType: {
              title: "some-organization-type-title",
            },
          },
        ],
      },
    },
  ],
  teamMembers: [
    {
      profile: {
        id: "some-profile-id",
        academicTitle: "some-profile-academic-title",
        firstName: "some-profile-first-name",
        lastName: "some-profile-last-name",
        avatar: null,
        username: "some-profile-username",
        position: "some-profile-position",
      },
    },
  ],
  childEvents: [
    {
      id: "some-child-id",
      name: "some-child-name",
      description: "some-child-description",
      slug: "some-child-slug",
      startTime: new Date("2022-09-19T09:00:00"),
      endTime: new Date("2022-09-19T09:00:00"),
      background: null,
      participantLimit: null,
      canceled: false,
      published: false,
      subline: "some-child-subline",
      participationUntil: new Date("2022-09-19T09:00:00"),
      participationFrom: new Date("2022-09-19T09:00:00"),
      stage: {
        title: "some-stage-title",
      },
      _count: {
        childEvents: 10,
        participants: 10,
        waitingList: 10,
      },
    },
  ],
  documents: [
    {
      document: {
        id: "some-document-id",
        filename: "some-document-filename",
        title: "some-document-title",
        description: "some-document-description",
      },
    },
  ],
  _count: {
    participants: 10,
    childEvents: 1,
  },
};

const fullyFilteredEvent = {
  id: "some-event-id",
  slug: "",
  published: true,
  background: null,
  name: "",
  startTime: "1970-01-01T00:00:00.000Z",
  endTime: "1970-01-01T00:00:00.000Z",
  venueName: null,
  venueStreet: null,
  venueStreetNumber: null,
  venueZipCode: null,
  venueCity: null,
  conferenceLink: null,
  conferenceCode: null,
  subline: null,
  participationUntil: "1970-01-01T00:00:00.000Z",
  participationFrom: "1970-01-01T00:00:00.000Z",
  participantLimit: null,
  description: null,
  canceled: true,
  stage: null,
  parentEvent: null,
  areas: [],
  types: [],
  tags: [],
  focuses: [],
  targetGroups: [],
  experienceLevel: null,
  responsibleOrganizations: [],
  teamMembers: [],
  speakers: [],
  participants: [],
  childEvents: [],
  documents: [],
  _count: { participants: 10, childEvents: 0 },
};

const eventVisibilitiesAllNotVisible = {
  id: false,
  slug: false,
  published: false,
  background: false,
  name: false,
  startTime: false,
  endTime: false,
  venueName: false,
  venueStreet: false,
  venueStreetNumber: false,
  venueZipCode: false,
  venueCity: false,
  conferenceLink: false,
  conferenceCode: false,
  subline: false,
  participationUntil: false,
  participationFrom: false,
  participantLimit: false,
  description: false,
  canceled: false,
  stage: false,
  parentEvent: false,
  areas: false,
  types: false,
  tags: false,
  focuses: false,
  targetGroups: false,
  experienceLevel: false,
  responsibleOrganizations: false,
  teamMembers: false,
  participants: false,
  speakers: false,
  childEvents: false,
  documents: false,
};

const eventVisibilitiesAllVisible = {
  id: true,
  slug: true,
  published: true,
  background: true,
  name: true,
  startTime: true,
  endTime: true,
  venueName: true,
  venueStreet: true,
  venueStreetNumber: true,
  venueZipCode: true,
  venueCity: true,
  conferenceLink: true,
  conferenceCode: true,
  subline: true,
  participationUntil: true,
  participationFrom: true,
  participantLimit: true,
  description: true,
  canceled: true,
  stage: true,
  parentEvent: true,
  areas: true,
  types: true,
  tags: true,
  focuses: true,
  targetGroups: true,
  experienceLevel: true,
  responsibleOrganizations: true,
  teamMembers: true,
  participants: true,
  speakers: true,
  childEvents: true,
  documents: true,
};

const profileVisibilitiesAllVisible = {
  id: true,
  academicTitle: true,
  firstName: true,
  lastName: true,
  avatar: true,
  username: true,
  position: true,
};

const profileVisibilitiesAllNotVisible = {
  id: false,
  academicTitle: false,
  firstName: false,
  lastName: false,
  avatar: false,
  username: false,
  position: false,
};

const organizationVisibilitiesAllVisible = {
  id: true,
  slug: true,
  logo: true,
  name: true,
  types: true,
};

const organizationVisibilitiesAllNotVisible = {
  id: false,
  slug: false,
  logo: false,
  name: false,
  types: false,
};

describe("/event/$slug", () => {
  describe("loader", () => {
    beforeEach(() => {
      jest.resetAllMocks();
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

    test("authenticated user (profile not found)", async () => {
      expect.assertions(2);

      (getSessionUser as jest.Mock).mockImplementationOnce(() => {
        return { id: "some-user-id" };
      });

      (prismaClient.profile.findFirst as jest.Mock).mockImplementationOnce(
        () => {
          return null;
        }
      );

      const request = new Request(testURL);
      try {
        await loader({ request, context: {}, params: { slug } });
      } catch (error) {
        const response = error as Response;
        expect(response.status).toBe(404);

        const json = await response.json();
        expect(json.message).toBe("Profile not found");
      }
    });

    test("authenticated user (terms not accepted)", async () => {
      expect.assertions(1);

      (getSessionUser as jest.Mock).mockImplementationOnce(() => {
        return { id: "some-user-id" };
      });

      (prismaClient.profile.findFirst as jest.Mock).mockImplementationOnce(
        () => {
          return {
            termsAccepted: false,
          };
        }
      );

      const request = new Request(testURL);
      const response = await loader({ request, context: {}, params: { slug } });

      expect(response).toStrictEqual(
        redirect(`/accept-terms?redirect_to=/event/${slug}`)
      );
    });

    test("event not found", async () => {
      expect.assertions(2);

      (getSessionUser as jest.Mock).mockImplementationOnce(() => {
        return null;
      });

      (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
        return null;
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

    test("authenticated user (event not published)", async () => {
      expect.assertions(2);

      (getSessionUser as jest.Mock).mockImplementationOnce(() => {
        return { id: "some-user-id" };
      });

      (prismaClient.profile.findFirst as jest.Mock).mockImplementationOnce(
        () => {
          return {
            termsAccepted: true,
          };
        }
      );

      (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
        return {
          id: "some-event-id",
          published: false,
        };
      });

      (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
        return null;
      });

      (
        prismaClient.participantOfEvent.findFirst as jest.Mock
      ).mockImplementationOnce(() => {
        return null;
      });

      (
        prismaClient.waitingParticipantOfEvent.findFirst as jest.Mock
      ).mockImplementationOnce(() => {
        return null;
      });

      (
        prismaClient.speakerOfEvent.findFirst as jest.Mock
      ).mockImplementationOnce(() => {
        return null;
      });

      (
        prismaClient.teamMemberOfEvent.findFirst as jest.Mock
      ).mockImplementationOnce(() => {
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

    test("anon user (event not published)", async () => {
      expect.assertions(2);

      (getSessionUser as jest.Mock).mockImplementationOnce(() => {
        return null;
      });

      (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
        return {
          id: "some-event-id",
          published: false,
        };
      });

      (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
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

    test("anon user full loader with child events (should filter unpublished child events and conference link)", async () => {
      expect.assertions(7);

      (getSessionUser as jest.Mock).mockImplementationOnce(() => {
        return null;
      });

      (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
        return fullPublishedEvent;
      });

      (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
        return null;
      });

      (prismaClient.$queryRaw as jest.Mock).mockImplementationOnce(() => {
        return [
          {
            id: "full-depth-speaker-id",
            firstName: "full-depth-speaker-first-name",
            lastName: "full-depth-speaker-last-name",
            username: "full-depth-speaker-username",
            position: "full-depth-speaker-position",
            avatar: null,
            academicTitle: "full-depth-speaker-academic-title",
          },
        ];
      });

      (prismaClient.$queryRaw as jest.Mock).mockImplementationOnce(() => {
        return [
          {
            id: "full-depth-participant-id",
            firstName: "full-depth-participant-first-name",
            lastName: "full-depth-participant-last-name",
            username: "full-depth-participant-username",
            position: "full-depth-participant-position",
            avatar: null,
            academicTitle: "full-depth-participant-academic-title",
          },
        ];
      });

      (prismaClient.eventVisibility.findFirst as jest.Mock).mockImplementation(
        () => {
          return eventVisibilitiesAllVisible;
        }
      );

      (prismaClient.eventVisibility.findFirst as jest.Mock).mockImplementation(
        () => {
          return eventVisibilitiesAllVisible;
        }
      );

      (
        prismaClient.profileVisibility.findFirst as jest.Mock
      ).mockImplementation(() => {
        return profileVisibilitiesAllVisible;
      });

      (
        prismaClient.profileVisibility.findFirst as jest.Mock
      ).mockImplementation(() => {
        return profileVisibilitiesAllVisible;
      });

      (
        prismaClient.profileVisibility.findFirst as jest.Mock
      ).mockImplementation(() => {
        return profileVisibilitiesAllVisible;
      });

      (prismaClient.eventVisibility.findFirst as jest.Mock).mockImplementation(
        () => {
          return eventVisibilitiesAllVisible;
        }
      );

      (
        prismaClient.organizationVisibility.findFirst as jest.Mock
      ).mockImplementation(() => {
        return organizationVisibilitiesAllVisible;
      });

      const request = new Request(testURL);
      const response = await loader({
        request,
        context: {},
        params: { slug },
      });
      const responseBody = await response.json();
      expect(responseBody.mode).toBe("anon");
      expect(responseBody.event).toStrictEqual({
        ...fullPublishedEvent,
        childEvents: [],
        conferenceLink: null,
        conferenceCode: null,
        startTime: "2022-09-19T07:00:00.000Z",
        endTime: "2022-09-19T07:00:00.000Z",
        participationFrom: "2022-09-19T07:00:00.000Z",
        participationUntil: "2022-09-19T07:00:00.000Z",
        speakers: [
          {
            profile: {
              id: "full-depth-speaker-id",
              firstName: "full-depth-speaker-first-name",
              lastName: "full-depth-speaker-last-name",
              username: "full-depth-speaker-username",
              position: "full-depth-speaker-position",
              avatar: null,
              academicTitle: "full-depth-speaker-academic-title",
            },
          },
        ],
        participants: [
          {
            profile: {
              id: "full-depth-participant-id",
              firstName: "full-depth-participant-first-name",
              lastName: "full-depth-participant-last-name",
              username: "full-depth-participant-username",
              position: "full-depth-participant-position",
              avatar: null,
              academicTitle: "full-depth-participant-academic-title",
            },
          },
        ],
      });
      expect(responseBody.userId).toBe(undefined);
      expect(responseBody.isParticipant).toBe(false);
      expect(responseBody.isOnWaitingList).toBe(false);
      expect(responseBody.isSpeaker).toBe(false);
      expect(responseBody.isTeamMember).toBe(false);
    });

    test("anon user full loader without child events (should filter visibilities)", async () => {
      expect.assertions(7);

      (getSessionUser as jest.Mock).mockImplementationOnce(() => {
        return null;
      });

      (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
        return {
          ...fullPublishedEvent,
          childEvents: [],
          _count: {
            participants: 10,
            childEvents: 0,
          },
        };
      });

      (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
        return null;
      });

      (
        prismaClient.speakerOfEvent.findMany as jest.Mock
      ).mockImplementationOnce(() => {
        return [
          {
            id: "some-speaker-id",
            firstName: "some-speaker-first-name",
            lastName: "some-speaker-last-name",
            username: "some-speaker-username",
            position: "some-speaker-position",
            avatar: null,
            academicTitle: "some-speaker-academic-title",
          },
        ];
      });

      (
        prismaClient.participantOfEvent.findMany as jest.Mock
      ).mockImplementationOnce(() => {
        return [
          {
            id: "some-participant-id",
            firstName: "some-participant-first-name",
            lastName: "some-participant-last-name",
            username: "some-participant-username",
            position: "some-participant-position",
            avatar: null,
            academicTitle: "some-participant-academic-title",
          },
        ];
      });

      (prismaClient.eventVisibility.findFirst as jest.Mock).mockImplementation(
        () => {
          return eventVisibilitiesAllNotVisible;
        }
      );

      (prismaClient.eventVisibility.findFirst as jest.Mock).mockImplementation(
        () => {
          return eventVisibilitiesAllNotVisible;
        }
      );

      (
        prismaClient.profileVisibility.findFirst as jest.Mock
      ).mockImplementation(() => {
        return profileVisibilitiesAllNotVisible;
      });

      (
        prismaClient.profileVisibility.findFirst as jest.Mock
      ).mockImplementation(() => {
        return profileVisibilitiesAllNotVisible;
      });

      (
        prismaClient.profileVisibility.findFirst as jest.Mock
      ).mockImplementation(() => {
        return profileVisibilitiesAllNotVisible;
      });

      (prismaClient.eventVisibility.findFirst as jest.Mock).mockImplementation(
        () => {
          return eventVisibilitiesAllNotVisible;
        }
      );

      (
        prismaClient.organizationVisibility.findFirst as jest.Mock
      ).mockImplementation(() => {
        return organizationVisibilitiesAllNotVisible;
      });

      const request = new Request(testURL);
      const response = await loader({
        request,
        context: {},
        params: { slug },
      });
      const responseBody = await response.json();
      expect(responseBody.mode).toBe("anon");
      expect(responseBody.event).toStrictEqual(fullyFilteredEvent);
      expect(responseBody.userId).toBe(undefined);
      expect(responseBody.isParticipant).toBe(false);
      expect(responseBody.isOnWaitingList).toBe(false);
      expect(responseBody.isSpeaker).toBe(false);
      expect(responseBody.isTeamMember).toBe(false);
    });

    test("authenticated user full loader with child events and all images (should filter unpublished child events and conference link)", async () => {
      expect.assertions(7);

      (getSessionUser as jest.Mock).mockImplementationOnce(() => {
        return {
          id: "some-user-id",
        };
      });

      (prismaClient.profile.findFirst as jest.Mock).mockImplementationOnce(
        () => {
          return {
            id: "some-user-id",
            termsAccepted: true,
          };
        }
      );

      (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
        return {
          ...fullPublishedEvent,
          background: "event-background-path",
          responsibleOrganizations: [
            {
              organization: {
                ...fullPublishedEvent.responsibleOrganizations[0].organization,
                logo: "organization-logo-path",
              },
            },
          ],
          teamMembers: [
            {
              profile: {
                ...fullPublishedEvent.teamMembers[0].profile,
                avatar: "profile-avatar-path",
              },
            },
          ],
          childEvents: [
            {
              ...fullPublishedEvent.childEvents[0],
              published: true,
              background: "child-background-path",
            },
            {
              ...fullPublishedEvent.childEvents[0],
              published: false,
              background: "child-background-path",
            },
          ],
        };
      });

      (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
        return null;
      });

      (
        prismaClient.participantOfEvent.findFirst as jest.Mock
      ).mockImplementationOnce(() => {
        return null;
      });

      (
        prismaClient.waitingParticipantOfEvent.findFirst as jest.Mock
      ).mockImplementationOnce(() => {
        return null;
      });

      (
        prismaClient.speakerOfEvent.findFirst as jest.Mock
      ).mockImplementationOnce(() => {
        return null;
      });

      (
        prismaClient.teamMemberOfEvent.findFirst as jest.Mock
      ).mockImplementationOnce(() => {
        return null;
      });

      (prismaClient.$queryRaw as jest.Mock).mockImplementationOnce(() => {
        return [
          {
            id: "full-depth-speaker-id",
            firstName: "full-depth-speaker-first-name",
            lastName: "full-depth-speaker-last-name",
            username: "full-depth-speaker-username",
            position: "full-depth-speaker-position",
            avatar: "full-depth-speaker-avatar-path",
            academicTitle: "full-depth-speaker-academic-title",
          },
        ];
      });

      (prismaClient.$queryRaw as jest.Mock).mockImplementationOnce(() => {
        return [
          {
            id: "full-depth-participant-id",
            firstName: "full-depth-participant-first-name",
            lastName: "full-depth-participant-last-name",
            username: "full-depth-participant-username",
            position: "full-depth-participant-position",
            avatar: "full-depth-participant-avatar-path",
            academicTitle: "full-depth-participant-academic-title",
          },
        ];
      });

      (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
        return null;
      });

      (
        prismaClient.teamMemberOfEvent.findFirst as jest.Mock
      ).mockImplementationOnce(() => {
        return null;
      });

      getImageURL.mockImplementationOnce(
        () => "full-depth-speaker-avatar-image-url"
      );

      getImageURL.mockImplementationOnce(() => "profile-avatar-image-url");

      getImageURL.mockImplementationOnce(
        () => "full-depth-participant-avatar-image-url"
      );

      getImageURL.mockImplementationOnce(() => "event-background-image-url");

      getImageURL.mockImplementationOnce(
        () => "event-background-blurred-image-url"
      );

      getImageURL.mockImplementationOnce(() => "child-background-image-url");

      getImageURL.mockImplementationOnce(
        () => "child-background-blurred-image-url"
      );

      getImageURL.mockImplementationOnce(() => "organization-logo-image-url");

      (
        prismaClient.participantOfEvent.findMany as jest.Mock
      ).mockImplementationOnce(() => {
        return [
          {
            eventId: "another-event-id",
          },
        ];
      });

      (
        prismaClient.waitingParticipantOfEvent.findMany as jest.Mock
      ).mockImplementationOnce(() => {
        return [
          {
            eventId: "another-event-id",
          },
        ];
      });

      (
        prismaClient.speakerOfEvent.findMany as jest.Mock
      ).mockImplementationOnce(() => {
        return [
          {
            eventId: "another-event-id",
          },
        ];
      });

      (
        prismaClient.teamMemberOfEvent.findMany as jest.Mock
      ).mockImplementationOnce(() => {
        return [
          {
            eventId: "another-event-id",
          },
        ];
      });

      const request = new Request(testURL);
      const response = await loader({
        request,
        context: {},
        params: { slug },
      });
      const responseBody = await response.json();
      expect(responseBody.mode).toBe("authenticated");
      expect(responseBody.event).toStrictEqual({
        ...fullPublishedEvent,
        childEvents: [
          {
            ...fullPublishedEvent.childEvents[0],
            startTime: "2022-09-19T07:00:00.000Z",
            endTime: "2022-09-19T07:00:00.000Z",
            participationFrom: "2022-09-19T07:00:00.000Z",
            participationUntil: "2022-09-19T07:00:00.000Z",
            published: true,
            background: "child-background-image-url",
            blurredChildBackground: "child-background-blurred-image-url",
            isTeamMember: false,
            isOnWaitingList: false,
            isParticipant: false,
            isSpeaker: false,
          },
        ],
        conferenceLink: null,
        conferenceCode: null,
        background: "event-background-image-url",
        blurredBackground: "event-background-blurred-image-url",
        startTime: "2022-09-19T07:00:00.000Z",
        endTime: "2022-09-19T07:00:00.000Z",
        participationFrom: "2022-09-19T07:00:00.000Z",
        participationUntil: "2022-09-19T07:00:00.000Z",
        speakers: [
          {
            profile: {
              id: "full-depth-speaker-id",
              firstName: "full-depth-speaker-first-name",
              lastName: "full-depth-speaker-last-name",
              username: "full-depth-speaker-username",
              position: "full-depth-speaker-position",
              avatar: "full-depth-speaker-avatar-image-url",
              academicTitle: "full-depth-speaker-academic-title",
            },
          },
        ],
        participants: [
          {
            profile: {
              id: "full-depth-participant-id",
              firstName: "full-depth-participant-first-name",
              lastName: "full-depth-participant-last-name",
              username: "full-depth-participant-username",
              position: "full-depth-participant-position",
              avatar: "full-depth-participant-avatar-image-url",
              academicTitle: "full-depth-participant-academic-title",
            },
          },
        ],

        responsibleOrganizations: [
          {
            organization: {
              ...fullPublishedEvent.responsibleOrganizations[0].organization,
              logo: "organization-logo-image-url",
            },
          },
        ],
        teamMembers: [
          {
            profile: {
              ...fullPublishedEvent.teamMembers[0].profile,
              avatar: "profile-avatar-image-url",
            },
          },
        ],
      });
      expect(responseBody.userId).toBe("some-user-id");
      expect(responseBody.isParticipant).toBe(false);
      expect(responseBody.isOnWaitingList).toBe(false);
      expect(responseBody.isSpeaker).toBe(false);
      expect(responseBody.isTeamMember).toBe(false);
    });

    test("admin/participant/speaker/team member/waiting list user full loader with conference link equals null", async () => {
      expect.assertions(7);

      (getSessionUser as jest.Mock).mockImplementationOnce(() => {
        return {
          id: "some-user-id",
        };
      });

      (prismaClient.profile.findFirst as jest.Mock).mockImplementationOnce(
        () => {
          return {
            id: "some-user-id",
            termsAccepted: true,
          };
        }
      );

      (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
        return {
          ...fullPublishedEvent,
          conferenceLink: null,
        };
      });

      (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
        return {
          id: "some-event-id",
        };
      });

      (
        prismaClient.participantOfEvent.findFirst as jest.Mock
      ).mockImplementationOnce(() => {
        return {
          eventId: "some-event-id",
        };
      });

      (
        prismaClient.waitingParticipantOfEvent.findFirst as jest.Mock
      ).mockImplementationOnce(() => {
        return {
          eventId: "some-event-id",
        };
      });

      (
        prismaClient.speakerOfEvent.findFirst as jest.Mock
      ).mockImplementationOnce(() => {
        return {
          eventId: "some-event-id",
        };
      });

      (
        prismaClient.teamMemberOfEvent.findFirst as jest.Mock
      ).mockImplementationOnce(() => {
        return {
          eventId: "some-event-id",
        };
      });

      (prismaClient.$queryRaw as jest.Mock).mockImplementationOnce(() => {
        return [
          {
            id: "full-depth-speaker-id",
            firstName: "full-depth-speaker-first-name",
            lastName: "full-depth-speaker-last-name",
            username: "full-depth-speaker-username",
            position: "full-depth-speaker-position",
            avatar: null,
            academicTitle: "full-depth-speaker-academic-title",
          },
        ];
      });

      (prismaClient.$queryRaw as jest.Mock).mockImplementationOnce(() => {
        return [
          {
            id: "full-depth-participant-id",
            firstName: "full-depth-participant-first-name",
            lastName: "full-depth-participant-last-name",
            username: "full-depth-participant-username",
            position: "full-depth-participant-position",
            avatar: null,
            academicTitle: "full-depth-participant-academic-title",
          },
        ];
      });

      (
        prismaClient.participantOfEvent.findMany as jest.Mock
      ).mockImplementationOnce(() => {
        return [
          {
            eventId: "some-child-id",
          },
        ];
      });

      (
        prismaClient.waitingParticipantOfEvent.findMany as jest.Mock
      ).mockImplementationOnce(() => {
        return [
          {
            eventId: "some-child-id",
          },
        ];
      });

      (
        prismaClient.speakerOfEvent.findMany as jest.Mock
      ).mockImplementationOnce(() => {
        return [
          {
            eventId: "some-child-id",
          },
        ];
      });

      (
        prismaClient.teamMemberOfEvent.findMany as jest.Mock
      ).mockImplementationOnce(() => {
        return [
          {
            eventId: "some-child-id",
          },
        ];
      });

      const request = new Request(testURL);
      const response = await loader({
        request,
        context: {},
        params: { slug },
      });
      const responseBody = await response.json();
      expect(responseBody.mode).toBe("admin");
      expect(responseBody.event).toStrictEqual({
        ...fullPublishedEvent,
        childEvents: [
          {
            ...fullPublishedEvent.childEvents[0],
            startTime: "2022-09-19T07:00:00.000Z",
            endTime: "2022-09-19T07:00:00.000Z",
            participationFrom: "2022-09-19T07:00:00.000Z",
            participationUntil: "2022-09-19T07:00:00.000Z",
            isTeamMember: true,
            isOnWaitingList: true,
            isParticipant: true,
            isSpeaker: true,
          },
        ],
        conferenceLink: "noch nicht bekannt",
        conferenceCode: null,
        startTime: "2022-09-19T07:00:00.000Z",
        endTime: "2022-09-19T07:00:00.000Z",
        participationFrom: "2022-09-19T07:00:00.000Z",
        participationUntil: "2022-09-19T07:00:00.000Z",
        speakers: [
          {
            profile: {
              id: "full-depth-speaker-id",
              firstName: "full-depth-speaker-first-name",
              lastName: "full-depth-speaker-last-name",
              username: "full-depth-speaker-username",
              position: "full-depth-speaker-position",
              avatar: null,
              academicTitle: "full-depth-speaker-academic-title",
            },
          },
        ],
        participants: [
          {
            profile: {
              id: "full-depth-participant-id",
              firstName: "full-depth-participant-first-name",
              lastName: "full-depth-participant-last-name",
              username: "full-depth-participant-username",
              position: "full-depth-participant-position",
              avatar: null,
              academicTitle: "full-depth-participant-academic-title",
            },
          },
        ],
      });
      expect(responseBody.userId).toBe("some-user-id");
      expect(responseBody.isParticipant).toBe(true);
      expect(responseBody.isOnWaitingList).toBe(true);
      expect(responseBody.isSpeaker).toBe(true);
      expect(responseBody.isTeamMember).toBe(true);
    });
  });
});
