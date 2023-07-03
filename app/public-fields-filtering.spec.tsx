import type { Event, Organization, Profile, Project } from "@prisma/client";
import { prismaClient } from "~/prisma";
import { filterProfileDataByVisibilitySettings } from "./public-fields-filtering.server";

jest.mock("~/prisma", () => {
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
  createdAt: new Date("1970-01-01T00:00:00Z"), // DateTime
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
  createdAt: new Date("1970-01-01T00:00:00Z"), // DateTime
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
  createdAt: new Date("1970-01-01T00:00:00Z"), // DateTime
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
  createdAt: new Date("1970-01-01T00:00:00Z"), // DateTime
};

test("key exists in entity but not in its visbility", async () => {
  // expect.assertions(1);
  (prismaClient.profileVisibility.findFirst as jest.Mock).mockImplementation(
    () => profileVisibility
  );
  const extendedProfile = {
    ...profile,
    // someFutureField: "some-future-field",
  };
  const result = await filterProfileDataByVisibilitySettings<
    typeof extendedProfile
  >([extendedProfile]);
  // expect(result[0].someFutureField).toBe("some-future-field");
});

test("Key exists in visbility but is not implemented in filter method", () => {});

test("filter entity by visibility settings", () => {});
