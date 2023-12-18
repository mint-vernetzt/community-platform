import { getSessionUser } from "~/auth.server";
import { testURL } from "~/lib/utils/tests";
import { prismaClient } from "~/prisma.server";
import { loader } from "./index";
import * as imageServerModule from "~/images.server";
import { redirect } from "@remix-run/node";

// TODO: fix type issues
// Globals of cypress and jest are conflicting
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
      profile: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
      profileVisibility: {
        findFirst: jest.fn(),
      },
      organizationVisibility: {
        findFirst: jest.fn(),
      },
      projectVisibility: {
        findFirst: jest.fn(),
      },
      eventVisibility: {
        findFirst: jest.fn(),
      },
      participantOfEvent: {
        findFirst: jest.fn(),
      },
      waitingParticipantOfEvent: {
        findFirst: jest.fn(),
      },
      speakerOfEvent: {
        findFirst: jest.fn(),
      },
      teamMemberOfEvent: {
        findFirst: jest.fn(),
      },
    },
  };
});

const profile = {
  id: "profile-id",
  username: "profile-username",
  avatar: null,
  background: null,
  email: "profile-email",
  phone: "profile-phone",
  facebook: "profile-facebook",
  linkedin: "profile-linkedin",
  twitter: "profile-twitter",
  xing: "profile-xing",
  website: "profile-website",
  youtube: "profile-youtube",
  instagram: "profile-instagram",
  firstName: "profile-first-name",
  lastName: "profile-last-name",
  academicTitle: "profile-academic-title",
  createdAt: "profile-created-at",
  position: "profile-position",
  bio: "profile-bio",
  skills: ["profile-skill"],
  interests: ["profile-interest"],
  areas: [
    {
      area: {
        name: "area-name",
      },
    },
  ],
  offers: [
    {
      offer: {
        title: "offer-title",
      },
    },
  ],
  seekings: [
    {
      seeking: {
        title: "seeking-title",
      },
    },
  ],
  memberOf: [
    {
      organization: {
        id: "organization-id",
        slug: "organization-slug",
        logo: null,
        name: "organization-name",
        types: [
          {
            organizationType: {
              title: "organization-type-title",
            },
          },
        ],
      },
    },
  ],
  teamMemberOfProjects: [
    {
      project: {
        id: "project-id",
        slug: "project-slug",
        logo: null,
        name: "project-name",
        awards: [
          {
            award: {
              id: "award-id",
              title: "award-title",
              shortTitle: "award-short-title",
              date: new Date("2022-09-19T09:00:00"),
              logo: null,
            },
          },
        ],
        responsibleOrganizations: [
          {
            organization: {
              id: "organization-id",
              name: "organization-name",
            },
          },
        ],
      },
    },
  ],
};

const filteredProfile = {
  id: "profile-id",
  username: "",
  avatar: null,
  background: null,
  email: "",
  phone: null,
  facebook: null,
  linkedin: null,
  twitter: null,
  xing: null,
  website: null,
  youtube: null,
  instagram: null,
  firstName: "",
  lastName: "",
  academicTitle: null,
  createdAt: "1970-01-01T00:00:00.000Z",
  position: null,
  bio: null,
  skills: [],
  interests: [],
  areas: [],
  offers: [],
  seekings: [],
  memberOf: [
    {
      organization: {
        id: "organization-id",
        slug: "",
        logo: null,
        name: "",
        types: [],
      },
    },
  ],
  teamMemberOfProjects: [
    {
      project: {
        id: "project-id",
        slug: "",
        logo: null,
        name: "",
        awards: [],
        responsibleOrganizations: [
          {
            organization: {
              id: "organization-id",
              name: "",
            },
          },
        ],
      },
    },
  ],
};

const profileVisibilitiesAllExceptRelationsNotVisible = {
  id: false,
  username: false,
  avatar: false,
  background: false,
  email: false,
  phone: false,
  facebook: false,
  linkedin: false,
  twitter: false,
  xing: false,
  website: false,
  youtube: false,
  instagram: false,
  firstName: false,
  lastName: false,
  academicTitle: false,
  createdAt: false,
  position: false,
  bio: false,
  skills: false,
  interests: false,
  areas: false,
  offers: false,
  seekings: false,
  memberOf: true,
  teamMemberOfProjects: true,
};

const organizationVisibilitiesAllNotVisible = {
  id: false,
  slug: false,
  logo: false,
  name: false,
  types: false,
};

const projectVisibilitiesAllExceptRelationsNotVisible = {
  id: false,
  slug: false,
  logo: false,
  name: false,
  awards: false,
  responsibleOrganizations: true,
};

const responsibleOrganizationVisibilitiesAllNotVisible = {
  id: false,
  name: false,
};

const profileEvents = {
  id: "profile-id",
  teamMemberOfEvents: [
    {
      event: {
        id: "event-id",
        name: "event-name",
        slug: "event-slug",
        published: true,
        parentEventId: "parent-id",
        startTime: new Date("2022-09-19T09:00:00"),
        endTime: new Date("2022-09-19T09:00:00"),
        participationUntil: new Date("2022-09-19T09:00:00"),
        participationFrom: new Date("2022-09-19T09:00:00"),
        participantLimit: 10,
        stage: {
          title: "stage-title",
        },
        canceled: false,
        subline: "event-subline",
        description: "event-description",
        _count: {
          participants: 10,
          waitingList: 5,
        },
        background: null,
      },
    },
  ],
  participatedEvents: [
    {
      event: {
        id: "event-id",
        name: "event-name",
        slug: "event-slug",
        published: true,
        parentEventId: "parent-id",
        startTime: new Date("2022-09-19T09:00:00"),
        endTime: new Date("2022-09-19T09:00:00"),
        participationUntil: new Date("2022-09-19T09:00:00"),
        participationFrom: new Date("2022-09-19T09:00:00"),
        participantLimit: 10,
        stage: {
          title: "stage-title",
        },
        canceled: false,
        subline: "event-subline",
        description: "event-description",
        _count: {
          childEvents: 1,
          participants: 10,
          waitingList: 5,
        },
        background: null,
      },
    },
  ],
  contributedEvents: [
    {
      event: {
        id: "event-id",
        name: "event-name",
        slug: "event-slug",
        published: true,
        parentEventId: "parent-id",
        startTime: new Date("2022-09-19T09:00:00"),
        endTime: new Date("2022-09-19T09:00:00"),
        participationUntil: new Date("2022-09-19T09:00:00"),
        participationFrom: new Date("2022-09-19T09:00:00"),
        participantLimit: 10,
        stage: {
          title: "stage-title",
        },
        canceled: false,
        subline: "event-subline",
        description: "event-description",
        _count: {
          childEvents: 1,
          participants: 10,
          waitingList: 5,
        },
        background: null,
      },
    },
  ],
  waitingForEvents: [
    {
      event: {
        id: "event-id",
        name: "event-name",
        slug: "event-slug",
        published: true,
        parentEventId: "parent-id",
        startTime: new Date("2022-09-19T09:00:00"),
        endTime: new Date("2022-09-19T09:00:00"),
        participationUntil: new Date("2022-09-19T09:00:00"),
        participationFrom: new Date("2022-09-19T09:00:00"),
        participantLimit: 10,
        stage: {
          title: "stage-title",
        },
        canceled: false,
        subline: "event-subline",
        description: "event-description",
        _count: {
          childEvents: 1,
          participants: 10,
          waitingList: 5,
        },
        background: null,
      },
    },
  ],
};

const profileEventsVisibilitiesAllExceptRelationsNotVisible = {
  id: false,
  teamMemberOfEvents: true,
  participatedEvents: true,
  contributedEvents: true,
  waitingForEvents: true,
};

const eventVisibilitiesAllNotVisible = {
  id: false,
  name: false,
  slug: false,
  published: false,
  parentEventId: false,
  startTime: false,
  endTime: false,
  participationUntil: false,
  participationFrom: false,
  participantLimit: false,
  stage: false,
  canceled: false,
  subline: false,
  description: false,
  background: false,
};

const filteredEvent = {
  id: "event-id",
  name: "",
  slug: "",
  published: true,
  parentEventId: null,
  startTime: "1970-01-01T00:00:00.000Z",
  endTime: "1970-01-01T00:00:00.000Z",
  participationUntil: "1970-01-01T00:00:00.000Z",
  participationFrom: "1970-01-01T00:00:00.000Z",
  participantLimit: null,
  stage: null,
  canceled: true,
  subline: null,
  description: null,
  _count: {
    childEvents: 1,
    participants: 10,
    waitingList: 5,
  },
  background: null,
};

describe("loader", () => {
  test("no params", async () => {
    expect.assertions(3);

    try {
      await loader({
        request: new Request(testURL),
        params: {},
        context: {},
      });
    } catch (error) {
      expect(error instanceof Response).toBe(true);

      const response = error as Response;
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toEqual({ message: '"username" missing' });
    }
  });

  test("authenticated user (profile not found)", async () => {
    expect.assertions(3);

    (getSessionUser as jest.Mock).mockImplementationOnce(() => {
      return { id: "some-user-id" };
    });

    (prismaClient.profile.findFirst as jest.Mock).mockImplementationOnce(() => {
      return null;
    });

    (prismaClient.profile.findFirst as jest.Mock).mockImplementationOnce(() => {
      return null;
    });

    try {
      await loader({
        request: new Request(testURL),
        params: { username: "some-username" },
        context: {},
      });
    } catch (error) {
      expect(error instanceof Response).toBe(true);

      const response = error as Response;
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json).toEqual({ message: "Profile not found" });
    }
  });

  test("authenticated user (terms not accepted)", async () => {
    expect.assertions(1);

    (getSessionUser as jest.Mock).mockImplementationOnce(() => {
      return { id: "some-user-id" };
    });

    (prismaClient.profile.findFirst as jest.Mock).mockImplementationOnce(() => {
      return null;
    });

    (prismaClient.profile.findFirst as jest.Mock).mockImplementationOnce(() => {
      return {
        termsAccepted: false,
      };
    });

    const request = new Request(testURL);
    const response = await loader({
      request,
      context: {},
      params: { username: "some-username" },
    });

    expect(response).toStrictEqual(
      redirect(`/accept-terms?redirect_to=/profile/some-username`)
    );
  });

  test("anon user (profile not found)", async () => {
    expect.assertions(3);

    (getSessionUser as jest.Mock).mockImplementationOnce(() => {
      return null;
    });

    (prismaClient.profile.findFirst as jest.Mock).mockImplementationOnce(() => {
      return null;
    });

    (prismaClient.profile.findUnique as jest.Mock).mockImplementationOnce(
      () => {
        return null;
      }
    );

    try {
      await loader({
        request: new Request(testURL),
        params: { username: "some-username" },
        context: {},
      });
    } catch (error) {
      expect(error instanceof Response).toBe(true);

      const response = error as Response;
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json).toEqual({ message: "Profile not found" });
    }
  });

  test("anon user full loader call with visibility filtering and without images", async () => {
    expect.assertions(6);

    (getSessionUser as jest.Mock).mockImplementationOnce(() => {
      return null;
    });

    (prismaClient.profile.findFirst as jest.Mock).mockImplementationOnce(() => {
      return null;
    });

    (prismaClient.profile.findUnique as jest.Mock).mockImplementationOnce(
      () => {
        return profile;
      }
    );

    (
      prismaClient.profileVisibility.findFirst as jest.Mock
    ).mockImplementationOnce(() => {
      return profileVisibilitiesAllExceptRelationsNotVisible;
    });

    (
      prismaClient.organizationVisibility.findFirst as jest.Mock
    ).mockImplementationOnce(() => {
      return organizationVisibilitiesAllNotVisible;
    });

    (
      prismaClient.projectVisibility.findFirst as jest.Mock
    ).mockImplementationOnce(() => {
      return projectVisibilitiesAllExceptRelationsNotVisible;
    });

    (
      prismaClient.organizationVisibility.findFirst as jest.Mock
    ).mockImplementationOnce(() => {
      return responsibleOrganizationVisibilitiesAllNotVisible;
    });

    (prismaClient.profile.findFirst as jest.Mock).mockImplementationOnce(() => {
      return profileEvents;
    });

    (
      prismaClient.profileVisibility.findFirst as jest.Mock
    ).mockImplementationOnce(() => {
      return profileEventsVisibilitiesAllExceptRelationsNotVisible;
    });

    (
      prismaClient.eventVisibility.findFirst as jest.Mock
    ).mockImplementationOnce(() => {
      return eventVisibilitiesAllNotVisible;
    });

    (
      prismaClient.eventVisibility.findFirst as jest.Mock
    ).mockImplementationOnce(() => {
      return eventVisibilitiesAllNotVisible;
    });

    (
      prismaClient.eventVisibility.findFirst as jest.Mock
    ).mockImplementationOnce(() => {
      return eventVisibilitiesAllNotVisible;
    });

    (
      prismaClient.eventVisibility.findFirst as jest.Mock
    ).mockImplementationOnce(() => {
      return eventVisibilitiesAllNotVisible;
    });

    (prismaClient.profile.findFirst as jest.Mock).mockImplementationOnce(() => {
      return profileEvents;
    });

    (
      prismaClient.profileVisibility.findFirst as jest.Mock
    ).mockImplementationOnce(() => {
      return profileEventsVisibilitiesAllExceptRelationsNotVisible;
    });

    (
      prismaClient.eventVisibility.findFirst as jest.Mock
    ).mockImplementationOnce(() => {
      return eventVisibilitiesAllNotVisible;
    });

    (
      prismaClient.eventVisibility.findFirst as jest.Mock
    ).mockImplementationOnce(() => {
      return eventVisibilitiesAllNotVisible;
    });

    (
      prismaClient.eventVisibility.findFirst as jest.Mock
    ).mockImplementationOnce(() => {
      return eventVisibilitiesAllNotVisible;
    });

    (
      prismaClient.eventVisibility.findFirst as jest.Mock
    ).mockImplementationOnce(() => {
      return eventVisibilitiesAllNotVisible;
    });

    const { waitingForEvents: _waitingForEvents, ...rest } = profileEvents;

    const request = new Request(testURL);
    const response = await loader({
      request,
      context: {},
      params: { username: "some-username" },
    });
    const responseBody = await response.json();

    expect(responseBody.mode).toStrictEqual("anon");
    expect(responseBody.data).toStrictEqual(filteredProfile);
    expect(responseBody.images).toStrictEqual({});
    expect(responseBody.futureEvents).toStrictEqual({
      ...rest,
      teamMemberOfEvents: [
        {
          event: {
            ...filteredEvent,
            _count: {
              participants: 10,
              waitingList: 5,
            },
            isOnWaitingList: false,
            isParticipant: false,
            isSpeaker: false,
            isTeamMember: false,
          },
        },
      ],
      participatedEvents: [
        {
          event: {
            ...filteredEvent,
            isOnWaitingList: false,
            isParticipant: false,
            isSpeaker: false,
            isTeamMember: false,
          },
        },
        {
          event: {
            ...filteredEvent,
            isOnWaitingList: false,
            isParticipant: false,
            isSpeaker: false,
            isTeamMember: false,
          },
        },
      ],
      contributedEvents: [
        {
          event: {
            ...filteredEvent,
            isOnWaitingList: false,
            isParticipant: false,
            isSpeaker: false,
            isTeamMember: false,
          },
        },
      ],
    });
    expect(responseBody.pastEvents).toStrictEqual({
      ...rest,
      teamMemberOfEvents: [
        {
          event: {
            ...filteredEvent,
            _count: {
              participants: 10,
              waitingList: 5,
            },
            isOnWaitingList: false,
            isParticipant: false,
            isSpeaker: false,
            isTeamMember: false,
          },
        },
      ],
      participatedEvents: [
        {
          event: {
            ...filteredEvent,
            isOnWaitingList: false,
            isParticipant: false,
            isSpeaker: false,
            isTeamMember: false,
          },
        },
        {
          event: {
            ...filteredEvent,
            isOnWaitingList: false,
            isParticipant: false,
            isSpeaker: false,
            isTeamMember: false,
          },
        },
      ],
      contributedEvents: [
        {
          event: {
            ...filteredEvent,
            isOnWaitingList: false,
            isParticipant: false,
            isSpeaker: false,
            isTeamMember: false,
          },
        },
      ],
    });
    expect(responseBody.userId).toBe(undefined);
  });

  test("owner/team member/speaker/participant/waiting participant user full loader call with images", async () => {
    expect.assertions(6);

    (getSessionUser as jest.Mock).mockImplementationOnce(() => {
      return { id: "some-user-id" };
    });

    (prismaClient.profile.findFirst as jest.Mock).mockImplementationOnce(() => {
      return {
        id: "some-user-id",
      };
    });

    (prismaClient.profile.findFirst as jest.Mock).mockImplementationOnce(() => {
      return {
        termsAccepted: true,
      };
    });

    (prismaClient.profile.findUnique as jest.Mock).mockImplementationOnce(
      () => {
        return {
          ...profile,
          avatar: "profile-avatar-path",
          background: "profile-background-path",
          memberOf: [
            {
              organization: {
                ...profile.memberOf[0].organization,
                logo: "organization-logo-path",
              },
            },
          ],
          teamMemberOfProjects: [
            {
              project: {
                ...profile.teamMemberOfProjects[0].project,
                logo: "project-logo-path",
                awards: [
                  {
                    award: {
                      ...profile.teamMemberOfProjects[0].project.awards[0]
                        .award,
                      logo: "award-logo-path",
                    },
                  },
                ],
              },
            },
          ],
        };
      }
    );

    getImageURL.mockImplementationOnce(() => "profile-avatar-image-url");

    getImageURL.mockImplementationOnce(() => "profile-background-image-url");

    getImageURL.mockImplementationOnce(() => "organization-logo-image-url");

    getImageURL.mockImplementationOnce(() => "project-logo-image-url");

    getImageURL.mockImplementationOnce(() => "award-logo-image-url");

    // EVENTS

    (prismaClient.profile.findFirst as jest.Mock).mockImplementationOnce(() => {
      return {
        ...profileEvents,
        teamMemberOfEvents: [
          {
            event: {
              ...profileEvents.teamMemberOfEvents[0].event,
              background: "event-background-path",
            },
          },
        ],
        participatedEvents: [
          {
            event: {
              ...profileEvents.participatedEvents[0].event,
              background: "event-background-path",
            },
          },
        ],
        contributedEvents: [
          {
            event: {
              ...profileEvents.contributedEvents[0].event,
              background: "event-background-path",
            },
          },
        ],
        waitingForEvents: [
          {
            event: {
              ...profileEvents.waitingForEvents[0].event,
              background: "event-background-path",
            },
          },
        ],
      };
    });

    getImageURL.mockImplementationOnce(() => "event-background-image-url");

    getImageURL.mockImplementationOnce(
      () => "event-background-blurred-image-url"
    );

    getImageURL.mockImplementationOnce(() => "event-background-image-url");

    getImageURL.mockImplementationOnce(
      () => "event-background-blurred-image-url"
    );

    getImageURL.mockImplementationOnce(() => "event-background-image-url");

    getImageURL.mockImplementationOnce(
      () => "event-background-blurred-image-url"
    );

    getImageURL.mockImplementationOnce(() => "event-background-image-url");

    getImageURL.mockImplementationOnce(
      () => "event-background-blurred-image-url"
    );

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

    (prismaClient.speakerOfEvent.findFirst as jest.Mock).mockImplementationOnce(
      () => {
        return {
          eventId: "some-event-id",
        };
      }
    );

    (
      prismaClient.teamMemberOfEvent.findFirst as jest.Mock
    ).mockImplementationOnce(() => {
      return {
        eventId: "some-event-id",
      };
    });

    // EVENTS 2

    (prismaClient.profile.findFirst as jest.Mock).mockImplementationOnce(() => {
      return {
        ...profileEvents,
        teamMemberOfEvents: [
          {
            event: {
              ...profileEvents.teamMemberOfEvents[0].event,
              background: "event-background-path",
            },
          },
        ],
        participatedEvents: [
          {
            event: {
              ...profileEvents.participatedEvents[0].event,
              background: "event-background-path",
            },
          },
        ],
        contributedEvents: [
          {
            event: {
              ...profileEvents.contributedEvents[0].event,
              background: "event-background-path",
            },
          },
        ],
        waitingForEvents: [
          {
            event: {
              ...profileEvents.waitingForEvents[0].event,
              background: "event-background-path",
            },
          },
        ],
      };
    });

    getImageURL.mockImplementationOnce(() => "event-background-image-url");

    getImageURL.mockImplementationOnce(
      () => "event-background-blurred-image-url"
    );

    getImageURL.mockImplementationOnce(() => "event-background-image-url");

    getImageURL.mockImplementationOnce(
      () => "event-background-blurred-image-url"
    );

    getImageURL.mockImplementationOnce(() => "event-background-image-url");

    getImageURL.mockImplementationOnce(
      () => "event-background-blurred-image-url"
    );

    getImageURL.mockImplementationOnce(() => "event-background-image-url");

    getImageURL.mockImplementationOnce(
      () => "event-background-blurred-image-url"
    );

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

    (prismaClient.speakerOfEvent.findFirst as jest.Mock).mockImplementationOnce(
      () => {
        return {
          eventId: "some-event-id",
        };
      }
    );

    (
      prismaClient.teamMemberOfEvent.findFirst as jest.Mock
    ).mockImplementationOnce(() => {
      return {
        eventId: "some-event-id",
      };
    });

    const { waitingForEvents: _waitingForEvents, ...rest } = profileEvents;

    const request = new Request(testURL);
    const response = await loader({
      request,
      context: {},
      params: { username: "some-username" },
    });
    const responseBody = await response.json();

    expect(responseBody.mode).toStrictEqual("owner");
    expect(responseBody.data).toStrictEqual({
      ...profile,
      avatar: "profile-avatar-path",
      background: "profile-background-path",
      memberOf: [
        {
          organization: {
            ...profile.memberOf[0].organization,
            logo: "organization-logo-image-url",
          },
        },
      ],
      teamMemberOfProjects: [
        {
          project: {
            ...profile.teamMemberOfProjects[0].project,
            logo: "project-logo-image-url",
            awards: [
              {
                award: {
                  ...profile.teamMemberOfProjects[0].project.awards[0].award,
                  logo: "award-logo-image-url",
                  date: "2022-09-19T07:00:00.000Z",
                },
              },
            ],
          },
        },
      ],
    });
    expect(responseBody.images).toStrictEqual({
      avatar: "profile-avatar-image-url",
      background: "profile-background-image-url",
    });
    expect(responseBody.futureEvents).toStrictEqual({
      ...rest,
      teamMemberOfEvents: [
        {
          event: {
            ...profileEvents.teamMemberOfEvents[0].event,
            background: "event-background-image-url",
            blurredBackground: "event-background-blurred-image-url",
            isParticipant: true,
            isOnWaitingList: true,
            isTeamMember: true,
            isSpeaker: true,
            startTime: "2022-09-19T07:00:00.000Z",
            endTime: "2022-09-19T07:00:00.000Z",
            participationFrom: "2022-09-19T07:00:00.000Z",
            participationUntil: "2022-09-19T07:00:00.000Z",
          },
        },
      ],
      participatedEvents: [
        {
          event: {
            ...profileEvents.participatedEvents[0].event,
            background: "event-background-image-url",
            blurredBackground: "event-background-blurred-image-url",
            isParticipant: true,
            isOnWaitingList: true,
            isTeamMember: true,
            isSpeaker: true,
            startTime: "2022-09-19T07:00:00.000Z",
            endTime: "2022-09-19T07:00:00.000Z",
            participationFrom: "2022-09-19T07:00:00.000Z",
            participationUntil: "2022-09-19T07:00:00.000Z",
          },
        },
        {
          event: {
            ...profileEvents.waitingForEvents[0].event,
            background: "event-background-image-url",
            blurredBackground: "event-background-blurred-image-url",
            isParticipant: true,
            isOnWaitingList: true,
            isTeamMember: true,
            isSpeaker: true,
            startTime: "2022-09-19T07:00:00.000Z",
            endTime: "2022-09-19T07:00:00.000Z",
            participationFrom: "2022-09-19T07:00:00.000Z",
            participationUntil: "2022-09-19T07:00:00.000Z",
          },
        },
      ],
      contributedEvents: [
        {
          event: {
            ...profileEvents.contributedEvents[0].event,
            background: "event-background-image-url",
            blurredBackground: "event-background-blurred-image-url",
            isParticipant: true,
            isOnWaitingList: true,
            isTeamMember: true,
            isSpeaker: true,
            startTime: "2022-09-19T07:00:00.000Z",
            endTime: "2022-09-19T07:00:00.000Z",
            participationFrom: "2022-09-19T07:00:00.000Z",
            participationUntil: "2022-09-19T07:00:00.000Z",
          },
        },
      ],
    });
    expect(responseBody.pastEvents).toStrictEqual({
      ...rest,
      teamMemberOfEvents: [
        {
          event: {
            ...profileEvents.teamMemberOfEvents[0].event,
            background: "event-background-image-url",
            blurredBackground: "event-background-blurred-image-url",
            isParticipant: true,
            isOnWaitingList: true,
            isTeamMember: true,
            isSpeaker: true,
            startTime: "2022-09-19T07:00:00.000Z",
            endTime: "2022-09-19T07:00:00.000Z",
            participationFrom: "2022-09-19T07:00:00.000Z",
            participationUntil: "2022-09-19T07:00:00.000Z",
          },
        },
      ],
      participatedEvents: [
        {
          event: {
            ...profileEvents.participatedEvents[0].event,
            background: "event-background-image-url",
            blurredBackground: "event-background-blurred-image-url",
            isParticipant: true,
            isOnWaitingList: true,
            isTeamMember: true,
            isSpeaker: true,
            startTime: "2022-09-19T07:00:00.000Z",
            endTime: "2022-09-19T07:00:00.000Z",
            participationFrom: "2022-09-19T07:00:00.000Z",
            participationUntil: "2022-09-19T07:00:00.000Z",
          },
        },
        {
          event: {
            ...profileEvents.waitingForEvents[0].event,
            background: "event-background-image-url",
            blurredBackground: "event-background-blurred-image-url",
            isParticipant: true,
            isOnWaitingList: true,
            isTeamMember: true,
            isSpeaker: true,
            startTime: "2022-09-19T07:00:00.000Z",
            endTime: "2022-09-19T07:00:00.000Z",
            participationFrom: "2022-09-19T07:00:00.000Z",
            participationUntil: "2022-09-19T07:00:00.000Z",
          },
        },
      ],
      contributedEvents: [
        {
          event: {
            ...profileEvents.contributedEvents[0].event,
            background: "event-background-image-url",
            blurredBackground: "event-background-blurred-image-url",
            isParticipant: true,
            isOnWaitingList: true,
            isTeamMember: true,
            isSpeaker: true,
            startTime: "2022-09-19T07:00:00.000Z",
            endTime: "2022-09-19T07:00:00.000Z",
            participationFrom: "2022-09-19T07:00:00.000Z",
            participationUntil: "2022-09-19T07:00:00.000Z",
          },
        },
      ],
    });
    expect(responseBody.userId).toBe("some-user-id");
  });
});
