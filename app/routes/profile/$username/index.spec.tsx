import type { User } from "@supabase/supabase-js";
import { getSessionUser } from "~/auth.server";
import {
  addUserParticipationStatus,
  combineEventsSortChronologically,
} from "~/lib/event/utils";
import { testURL } from "~/lib/utils/tests";
import { prismaClient } from "~/prisma";
import { getProfileByUsername } from "~/profile.server";
import { loader } from "./index";
import { deriveMode } from "./utils.server";

/** @type {jest.Expect} */
// @ts-ignore
const expect = global.expect;

const path = "/profile/$username";

jest.mock("~/auth.server", () => {
  return {
    ...jest.requireActual("~/auth.server"),
    getSessionUser: jest.fn(),
  };
});

jest.mock("~/profile.server", () => {
  return {
    getProfileByUsername: jest.fn(),
    getProfileByUserId: jest.fn(),
  };
});

jest.mock("~/lib/event/utils", () => {
  return {
    addUserParticipationStatus: jest.fn(),
    combineEventsSortChronologically: jest.fn(),
  };
});

jest.mock("~/prisma", () => {
  return {
    prismaClient: {
      profile: {
        findFirst: jest.fn(),
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
    },
  };
});

const organization = {
  id: "some-organization",
  slug: "some-organization-slug",
  email: "some@organization.de",
  logo: null,
  background: null,
};

const organizationVisibility = {
  id: "some-organization-visibility",
  organizationId: "some-organization",
  slug: true,
  email: false,
  logo: false,
  background: false,
};

const filteredOrganization = {
  id: "some-organization",
  slug: "some-organization-slug",
  email: null,
  logo: null,
  background: null,
};

const project = {
  id: "some-project",
  slug: "some-project-slug",
  email: "some@project.de",
  logo: null,
  background: null,
  awards: [],
  responsibleOrganizations: [{ organization: organization }],
};

const projectVisibility = {
  id: "some-project-visibility",
  projectId: "some-project",
  slug: true,
  email: false,
  logo: false,
  background: false,
  awards: true,
  responsibleOrganizations: true,
};

const filteredProject = {
  id: "some-project",
  slug: "some-project-slug",
  email: null,
  logo: null,
  background: null,
  awards: [],
  responsibleOrganizations: [{ organization: filteredOrganization }],
};

const profile = {
  id: "some-profile-id",
  username: "username",
  firstName: "User",
  lastName: "Name",
  email: "user.name@company.com",
  phone: "+49 0123 456 78",
  avatar: null,
  background: null,
  memberOf: [{ organization: organization }],
  teamMemberOfProjects: [{ project: project }],
};

const profileVisibility = {
  id: "some-profile-visbility-id",
  profileId: "some-profile-id",
  username: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: false,
  avatar: true,
  background: true,
  memberOf: false,
  teamMemberOfProjects: true,
  teamMemberOfEvents: true,
  contributedEvents: true,
  participatedEvents: false,
  waitingForEvents: false,
};

const filteredProfile = {
  id: "some-profile-id",
  username: "username",
  firstName: "User",
  lastName: "Name",
  email: "user.name@company.com",
  phone: null,
  avatar: null,
  background: null,
  memberOf: [],
  teamMemberOfProjects: [{ project: filteredProject }],
};

const event = {
  id: "some-event",
  slug: "some-event-slug",
  background: null,
  conferenceLink: "some-conference.de",
};

const eventVisibility = {
  id: "some-event-visibility",
  eventId: "some-event",
  slug: true,
  background: true,
  conferenceLink: false,
};

const filteredEvent = {
  id: "some-event",
  slug: "some-event-slug",
  background: null,
  conferenceLink: null,
};

const profileEvents = {
  id: "some-profile-id",
  teamMemberOfEvents: [{ event: event }],
  contributedEvents: [{ event: event }],
  participatedEvents: [{ event: event }],
  waitingForEvents: [{ event: event }],
};

const filteredProfileEvents = {
  id: "some-profile-id",
  teamMemberOfEvents: [{ event: filteredEvent }],
  contributedEvents: [{ event: filteredEvent }],
  participatedEvents: [],
};

const unfilteredProfileEvents = {
  teamMemberOfEvents: [{ event: event }],
  contributedEvents: [{ event: event }],
  participatedEvents: [{ event: event }, { event: event }],
};

const sessionUser: User = {
  id: "sessionUserId",
  app_metadata: {},
  user_metadata: {},
  aud: "",
  created_at: "",
};

test("deriveMode", () => {
  expect(deriveMode("profileUserId", sessionUser)).toBe("authenticated");
  expect(deriveMode("sessionUserId", sessionUser)).toBe("owner");
  expect(deriveMode("profileUser", null)).toBe("anon");
});

describe("errors", () => {
  beforeAll(() => {
    (getSessionUser as jest.Mock).mockImplementation(() => null);
    (getProfileByUsername as jest.Mock).mockImplementation(() => null);
  });
  test("empty username", async () => {
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

  test("profile doesn't exists", async () => {
    expect.assertions(3);
    try {
      await loader({
        request: new Request(testURL),
        params: { username: "notexists" },
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

  afterAll(() => {
    (getSessionUser as jest.Mock).mockReset();
    (getProfileByUsername as jest.Mock).mockReset();
  });
});

describe("get profile (anon)", () => {
  beforeAll(() => {
    (getSessionUser as jest.Mock).mockImplementation(() => null);
    (getProfileByUsername as jest.Mock).mockImplementation(() => profile);
    (prismaClient.profileVisibility.findFirst as jest.Mock).mockImplementation(
      () => profileVisibility
    );
    (
      prismaClient.organizationVisibility.findFirst as jest.Mock
    ).mockImplementation(() => organizationVisibility);
    (prismaClient.projectVisibility.findFirst as jest.Mock).mockImplementation(
      () => projectVisibility
    );
    (prismaClient.profile.findFirst as jest.Mock).mockImplementation(
      () => profileEvents
    );
    (prismaClient.eventVisibility.findFirst as jest.Mock).mockImplementation(
      () => eventVisibility
    );
    (combineEventsSortChronologically as jest.Mock).mockImplementation(
      (participatedEvents, waitingForEvents) => [
        ...participatedEvents,
        ...waitingForEvents,
      ]
    );
    (addUserParticipationStatus as jest.Mock).mockImplementation(
      (events) => events
    );
  });

  test("receive only public data", async () => {
    const res = await loader({
      request: new Request(`${testURL}/${path}`),
      params: { username: profile.username },
      context: {},
    });

    const json = await res.json();

    const { mode, userId, data, futureEvents } = json;

    console.log({ profileEvents });

    expect(mode).toEqual("anon");
    expect(userId).toBeUndefined();

    expect(data).toMatchObject(filteredProfile);

    expect(data).not.toMatchObject(profile);

    expect(futureEvents).toMatchObject(filteredProfileEvents);

    expect(futureEvents).not.toMatchObject(profileEvents);
  });

  afterAll(() => {
    (getSessionUser as jest.Mock).mockReset();
    (getProfileByUsername as jest.Mock).mockReset();
    (prismaClient.profileVisibility.findFirst as jest.Mock).mockReset();
    (prismaClient.organizationVisibility.findFirst as jest.Mock).mockReset();
    (prismaClient.projectVisibility.findFirst as jest.Mock).mockReset();
    (prismaClient.profile.findFirst as jest.Mock).mockReset();
    (prismaClient.eventVisibility.findFirst as jest.Mock).mockReset();
    (combineEventsSortChronologically as jest.Mock).mockReset();
    (addUserParticipationStatus as jest.Mock).mockReset();
  });
});

describe("get profile (authenticated)", () => {
  beforeAll(() => {
    (getSessionUser as jest.Mock).mockImplementation(() => {
      return { id: "another-id" };
    });
    (getProfileByUsername as jest.Mock).mockImplementation(() => profile);
    (prismaClient.profile.findFirst as jest.Mock).mockImplementation(() => ({
      test: true,
      ...profileEvents,
    }));
    (combineEventsSortChronologically as jest.Mock).mockImplementation(
      (participatedEvents, waitingForEvents) => [
        ...participatedEvents,
        ...waitingForEvents,
      ]
    );
    (addUserParticipationStatus as jest.Mock).mockImplementation(
      (events) => events
    );
  });
  test("can read all fields", async () => {
    const res = await loader({
      request: new Request(`${testURL}/${path}`),
      params: { username: profile.username },
      context: {},
    });

    const json = await res.json();

    const { mode, userId, data, futureEvents } = json;

    expect(mode).toEqual("authenticated");

    expect(userId).toBeDefined();

    expect(data).toMatchObject(profile);

    expect(futureEvents).toMatchObject(unfilteredProfileEvents);
  });

  afterAll(() => {
    (getSessionUser as jest.Mock).mockReset();
    (getProfileByUsername as jest.Mock).mockReset();
    (prismaClient.profile.findFirst as jest.Mock).mockReset();
    (combineEventsSortChronologically as jest.Mock).mockReset();
    (addUserParticipationStatus as jest.Mock).mockReset();
  });
});

describe("get profile (owner)", () => {
  beforeAll(() => {
    (getSessionUser as jest.Mock).mockImplementation(() => {
      return { id: profile.id };
    });
    (getProfileByUsername as jest.Mock).mockImplementation(() => profile);
    (prismaClient.profile.findFirst as jest.Mock).mockImplementation(
      () => profileEvents
    );
    (combineEventsSortChronologically as jest.Mock).mockImplementation(
      (participatedEvents, waitingForEvents) => [
        ...participatedEvents,
        ...waitingForEvents,
      ]
    );
    (addUserParticipationStatus as jest.Mock).mockImplementation(
      (events) => events
    );
  });

  test("can read all fields", async () => {
    const res = await loader({
      request: new Request(`${testURL}/${path}`),
      params: { username: profile.username },
      context: {},
    });

    const json = await res.json();

    const { mode, userId, data, futureEvents } = json;

    expect(mode).toEqual("owner");

    expect(userId).toBeDefined();

    expect(data).toMatchObject(profile);

    expect(futureEvents).toMatchObject(unfilteredProfileEvents);
  });

  afterAll(() => {
    (getSessionUser as jest.Mock).mockReset();
    (getProfileByUsername as jest.Mock).mockReset();
    (prismaClient.profile.findFirst as jest.Mock).mockReset();
    (combineEventsSortChronologically as jest.Mock).mockReset();
    (addUserParticipationStatus as jest.Mock).mockReset();
  });
});
