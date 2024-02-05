import type { Event, Organization, Profile, Project } from "@prisma/client";
import { prismaClient } from "~/prisma.server";
import {
  filterEventByVisibility,
  filterOrganizationByVisibility,
  filterProfileByVisibility,
  filterProjectByVisibility,
} from "./public-fields-filtering.server";

// TODO: fix type issues
// Globals of cypress and jest are conflicting
// @ts-ignore
const expect = global.expect as jest.Expect;

jest.mock("~/prisma.server", () => {
  return {
    prismaClient: {
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

type TestProfile = Pick<
  Profile,
  "id" | "username" | "phone" | "createdAt" | "termsAccepted" | "score"
> & {
  memberOf: any[];
};

const profile: TestProfile = {
  id: "some-profile-id",
  username: "some-username", // String
  phone: "1234/56789", // String?
  memberOf: [
    // []
    {
      organization: {
        id: "some-organization",
        slug: "some-organization-slug",
      },
    },
  ],
  createdAt: new Date("2023-06-06T13:00:00Z"), // DateTime
  termsAccepted: true, // Boolean
  score: 5, // Int
};

const profileVisibility = {
  id: "some-profile-visibility-id",
  profileId: "some-profile-id",
  username: false,
  phone: false,
  memberOf: false,
  createdAt: false,
  termsAccepted: false,
  score: false,
};

const filteredProfile: TestProfile = {
  id: "some-profile-id",
  username: "", // String
  phone: null, // String?
  memberOf: [], // []
  createdAt: new Date("1970-01-01T00:00:00.000Z"), // DateTime
  termsAccepted: true, // Boolean
  score: 0, // Int
};

type TestOrganization = Pick<
  Organization,
  "id" | "slug" | "phone" | "createdAt" | "supportedBy" | "score"
>;

const organization: TestOrganization = {
  id: "some-organization-id",
  slug: "some-slug", // String
  phone: "1234/56789", // String?
  supportedBy: ["some-supporter", "another-supporter"], // []
  createdAt: new Date("2023-06-06T13:00:00Z"), // DateTime
  score: 5, // Int
};

const organizationVisibility = {
  id: "some-organization-visibility-id",
  organizationId: "some-organization-id",
  slug: false,
  phone: false,
  supportedBy: false,
  createdAt: false,
  score: false,
};

const filteredOrganization: TestOrganization = {
  id: "some-organization-id",
  slug: "", // String
  phone: null, // String?
  supportedBy: [], // []
  createdAt: new Date("1970-01-01T00:00:00.000Z"), // DateTime
  score: 0, // Int
};

type TestEvent = Pick<
  Event,
  "id" | "slug" | "description" | "createdAt" | "canceled"
> & {
  speakers: any[];
};

const event: TestEvent = {
  id: "some-event-id",
  slug: "some-slug", // String
  description: "some-description", // String?
  speakers: [
    // []
    {
      profile: {
        id: "some-profile-id",
        username: "some-profile-username",
      },
    },
  ],
  createdAt: new Date("2023-06-06T13:00:00Z"), // DateTime
  canceled: true, // Boolean
};

const eventVisibility = {
  id: "some-event-visibility-id",
  eventId: "some-event-id",
  slug: false,
  description: false,
  speakers: false,
  createdAt: false,
  canceled: false,
};

const filteredEvent: TestEvent = {
  id: "some-event-id",
  slug: "", // String
  description: null, // String?
  speakers: [], // []
  createdAt: new Date("1970-01-01T00:00:00.000Z"), // DateTime
  canceled: true, // Boolean
};

type TestProject = Pick<
  Project,
  "id" | "slug" | "description" | "createdAt"
> & {
  teamMembers: any[];
};

const project: TestProject = {
  id: "some-project-id",
  slug: "some-slug", // String
  description: "some-description", // String?
  teamMembers: [
    // []
    {
      profile: {
        id: "some-profile-id",
        username: "some-profile-username",
      },
    },
  ],
  createdAt: new Date("2023-06-06T13:00:00Z"), // DateTime
};

const projectVisibility = {
  id: "some-project-visibility-id",
  projectId: "some-project-id",
  slug: false,
  description: false,
  teamMembers: false,
  createdAt: false,
};

const filteredProject: TestProject = {
  id: "some-project-id",
  slug: "", // String
  description: null, // String?
  teamMembers: [], // []
  createdAt: new Date("1970-01-01T00:00:00.000Z"), // DateTime
};

test("key exists in entity but not in its visbility", async () => {
  expect.assertions(4);

  const consoleErrorSpy = jest.spyOn(global.console, "error");

  (
    prismaClient.profileVisibility.findFirst as jest.Mock
  ).mockImplementationOnce(() => profileVisibility);
  const extendedProfile = {
    ...profile,
    someFutureField: "some-future-field",
  };
  await filterProfileByVisibility<
    // This type error is intentionally and caused by the operation this test focuses on
    // @ts-ignore
    typeof extendedProfile
  >(extendedProfile);
  expect(consoleErrorSpy).toHaveBeenCalledWith(
    "profile.someFutureField is not present in the profile visibilities."
  );

  (
    prismaClient.organizationVisibility.findFirst as jest.Mock
  ).mockImplementationOnce(() => organizationVisibility);
  const extendedOrganization = {
    ...organization,
    someFutureField: "some-future-field",
  };
  await filterOrganizationByVisibility<
    // This type error is intentionally and caused by the operation this test focuses on
    // @ts-ignore
    typeof extendedOrganization
  >(extendedOrganization);
  expect(consoleErrorSpy).toHaveBeenCalledWith(
    "organization.someFutureField is not present in the organization visibilities."
  );

  (prismaClient.eventVisibility.findFirst as jest.Mock).mockImplementationOnce(
    () => eventVisibility
  );
  const extendedEvent = {
    ...event,
    someFutureField: "some-future-field",
  };
  // This type error is intentionally and caused by the operation this test focuses on
  // @ts-ignore
  await filterEventByVisibility<typeof extendedEvent>(extendedEvent);
  expect(consoleErrorSpy).toHaveBeenCalledWith(
    "event.someFutureField is not present in the event visibilities."
  );

  (
    prismaClient.projectVisibility.findFirst as jest.Mock
  ).mockImplementationOnce(() => projectVisibility);
  const extendedProject = {
    ...project,
    someFutureField: "some-future-field",
  };
  // This type error is intentionally and caused by the operation this test focuses on
  // @ts-ignore
  await filterProjectByVisibility<typeof extendedProject>(extendedProject);
  expect(consoleErrorSpy).toHaveBeenCalledWith(
    "project.someFutureField is not present in the project visibilities."
  );
});

test("Key exists in visbility but is not implemented in filter method", async () => {
  expect.assertions(4);

  const consoleErrorSpy = jest.spyOn(global.console, "error");

  const extendedProfileVisibility = {
    ...profileVisibility,
    someFutureField: true,
  };
  (
    prismaClient.profileVisibility.findFirst as jest.Mock
  ).mockImplementationOnce(() => {
    return extendedProfileVisibility;
  });
  await filterProfileByVisibility<typeof profile>(profile);
  expect(consoleErrorSpy).toHaveBeenCalledWith(
    "The ProfileVisibility key someFutureField was not checked for public access as its not implemented in the filterProfileDataByVisibilitySettings() method."
  );

  const extendedOrganizationVisibility = {
    ...organizationVisibility,
    someFutureField: false,
  };
  (
    prismaClient.organizationVisibility.findFirst as jest.Mock
  ).mockImplementationOnce(() => extendedOrganizationVisibility);
  await filterOrganizationByVisibility<typeof organization>(organization);
  expect(consoleErrorSpy).toHaveBeenCalledWith(
    "The OrganizationVisibility key someFutureField was not checked for public access as its not implemented in the filterProfileDataByVisibilitySettings() method."
  );

  const extendedEventVisibility = {
    ...eventVisibility,
    someFutureField: true,
  };
  (prismaClient.eventVisibility.findFirst as jest.Mock).mockImplementationOnce(
    () => extendedEventVisibility
  );
  await filterEventByVisibility<typeof event>(event);
  expect(consoleErrorSpy).toHaveBeenCalledWith(
    "The EventVisibility key someFutureField was not checked for public access as its not implemented in the filterProfileDataByVisibilitySettings() method."
  );

  const extendedProjectVisibility = {
    ...projectVisibility,
    someFutureField: false,
  };
  (
    prismaClient.projectVisibility.findFirst as jest.Mock
  ).mockImplementationOnce(() => extendedProjectVisibility);
  await filterProjectByVisibility<typeof project>(project);
  expect(consoleErrorSpy).toHaveBeenCalledWith(
    "The ProjectVisibility key someFutureField was not checked for public access as its not implemented in the filterProfileDataByVisibilitySettings() method."
  );
});

test("filter entity by visibility settings", async () => {
  expect.assertions(4);

  (
    prismaClient.profileVisibility.findFirst as jest.Mock
  ).mockImplementationOnce(() => profileVisibility);
  const resultProfile = await filterProfileByVisibility<typeof profile>(
    profile
  );
  expect(resultProfile).toEqual(filteredProfile);

  (
    prismaClient.organizationVisibility.findFirst as jest.Mock
  ).mockImplementationOnce(() => organizationVisibility);
  const resultOrganization = await filterOrganizationByVisibility<
    typeof organization
  >(organization);
  expect(resultOrganization).toEqual(filteredOrganization);

  (prismaClient.eventVisibility.findFirst as jest.Mock).mockImplementationOnce(
    () => eventVisibility
  );
  const resultEvent = await filterEventByVisibility<typeof event>(event);
  expect(resultEvent).toEqual(filteredEvent);

  (
    prismaClient.projectVisibility.findFirst as jest.Mock
  ).mockImplementationOnce(() => projectVisibility);
  const resultProject = await filterProjectByVisibility<typeof project>(
    project
  );
  expect(resultProject).toEqual(filteredProject);
});
