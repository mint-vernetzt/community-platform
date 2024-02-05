import { createRequestWithFormData, testURL } from "~/lib/utils/tests";
import { action, loader } from "./general";
import * as authServerModule from "~/auth.server";
import { type User } from "@supabase/supabase-js";
import { prismaClient } from "~/prisma.server";
import { updateProfileById } from "../utils.server";

// TODO: fix type issues
// Globals of cypress and jest are conflicting
// @ts-ignore
const expect = global.expect as jest.Expect;

const username = "sookie";

const fullLoaderProfile = {
  id: "profile-id",
  academicTitle: "profile-academic-title",
  position: "profile-position",
  firstName: "profile-first-name",
  lastName: "profile-last-name",
  email: "profile-email",
  phone: "profile-phone",
  bio: "profile-bio",
  skills: ["profile-skill"],
  interests: ["profile-interest"],
  website: "profile-website",
  linkedin: "profile-linkedin",
  twitter: "profile-twitter",
  xing: "profile-xing",
  instagram: "profile-instagram",
  youtube: "profile-youtube",
  facebook: "profile-facebook",
  areas: [
    {
      area: {
        id: "area-id",
      },
    },
  ],
  offers: [
    {
      offer: {
        id: "offer-id",
      },
    },
  ],
  seekings: [
    {
      offer: {
        id: "seeking-id",
      },
    },
  ],
};

const profileVisibilities = {
  id: true,
  academicTitle: true,
  position: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  bio: true,
  skills: true,
  interests: true,
  website: true,
  linkedin: true,
  twitter: true,
  xing: true,
  instagram: true,
  youtube: true,
  facebook: true,
  areas: true,
  offers: true,
  seekings: true,
};

const getSessionUserOrThrow = jest.spyOn(
  authServerModule,
  "getSessionUserOrThrow"
);

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
      area: {
        findMany: jest.fn(),
      },
      offer: {
        findMany: jest.fn(),
      },
    },
  };
});

jest.mock("../utils.server", () => {
  return {
    ...jest.requireActual("../utils.server"),
    updateProfileById: jest.fn(),
  };
});

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
      expect(json.message).toBe('"username" missing');
    }
  });

  test("anon user", async () => {
    expect.assertions(2);

    try {
      await loader({
        request: new Request(testURL),
        context: {},
        params: { username },
      });
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json.message).toBe("No session or session user found");
    }
  });

  test("authenticated user", async () => {
    expect.assertions(1);

    getSessionUserOrThrow.mockResolvedValueOnce({
      id: "some-user-id",
    } as User);

    (prismaClient.profile.findFirst as jest.Mock).mockResolvedValueOnce(null);

    try {
      await loader({
        request: new Request(testURL),
        context: {},
        params: { username },
      });
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(403);
    }
  });

  test("profile not found", async () => {
    expect.assertions(2);
    getSessionUserOrThrow.mockResolvedValueOnce({
      id: "some-user-id",
    } as User);

    (prismaClient.profile.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-profile-id",
    });

    (prismaClient.profile.findFirst as jest.Mock).mockResolvedValueOnce(null);

    try {
      const request = new Request(testURL);
      await loader({ request, context: {}, params: { username } });
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(404);

      const json = await response.json();
      expect(json.message).toBe("error.profileNotFound");
    }
  });
  test("profile visibilities not found", async () => {
    expect.assertions(2);
    getSessionUserOrThrow.mockResolvedValueOnce({
      id: "some-user-id",
    } as User);

    (prismaClient.profile.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-profile-id",
    });

    (prismaClient.profile.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-profile-id",
    });

    (
      prismaClient.profileVisibility.findFirst as jest.Mock
    ).mockResolvedValueOnce(null);

    try {
      const request = new Request(testURL);
      await loader({ request, context: {}, params: { username } });
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(404);

      const json = await response.json();
      expect(json.message).toBe("error.noVisibilities");
    }
  });
  test("admin user full loader call", async () => {
    expect.assertions(4);
    getSessionUserOrThrow.mockResolvedValueOnce({
      id: "some-user-id",
    } as User);

    (prismaClient.profile.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-profile-id",
    });

    (prismaClient.profile.findFirst as jest.Mock).mockResolvedValueOnce(
      fullLoaderProfile
    );

    (
      prismaClient.profileVisibility.findFirst as jest.Mock
    ).mockResolvedValueOnce(profileVisibilities);

    (prismaClient.offer.findMany as jest.Mock).mockResolvedValueOnce([
      {
        title: "some-offer-title",
      },
    ]);

    (prismaClient.area.findMany as jest.Mock).mockResolvedValueOnce([
      {
        name: "some-area-name",
      },
    ]);

    const { seekings: _seekings, ...rest } = fullLoaderProfile;

    const request = new Request(testURL);
    const response = await loader({
      request,
      context: {},
      params: { username },
    });

    const responseBody = await response.json();

    expect(responseBody.profile).toStrictEqual({
      ...rest,
      areas: ["area-id"],
      offers: ["offer-id"],
      seekings: ["seeking-id"],
    });
    expect(responseBody.profileVisibilities).toStrictEqual(profileVisibilities);
    expect(responseBody.offers).toStrictEqual([
      {
        title: "some-offer-title",
      },
    ]);
    expect(responseBody.areas).toStrictEqual([
      {
        name: "some-area-name",
      },
    ]);
  });
});

const formDefaults = {
  academicTitle: "",
  position: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  bio: "",
  areas: [],
  skills: [],
  offers: [],
  interests: [],
  seekings: [],
  privateFields: [],
  website: "",
  facebook: "",
  linkedin: "",
  twitter: "",
  youtube: "",
  instagram: "",
  xing: "",
};

const parsedDataDefaults = Object.entries(formDefaults).reduce(
  (acc: { [key: string]: string | null | string[] }, cur) => {
    const [key, value] = cur;
    if (value === "") {
      acc[key] = null;
    } else {
      acc[key] = value;
    }
    return acc;
  },
  {}
);

describe("action", () => {
  test("no params", async () => {
    expect.assertions(2);
    const request = createRequestWithFormData({});

    try {
      await action({ request, context: {}, params: {} });
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.message).toBe('"username" missing');
    }
  });

  test("anon user", async () => {
    expect.assertions(2);
    const request = createRequestWithFormData({});

    try {
      await action({
        request,
        context: {},
        params: { username },
      });
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json.message).toBe("No session or session user found");
    }
  });

  test("authenticated user", async () => {
    expect.assertions(1);
    const request = createRequestWithFormData({});

    getSessionUserOrThrow.mockResolvedValueOnce({
      id: "some-user-id",
    } as User);

    (prismaClient.profile.findFirst as jest.Mock).mockResolvedValueOnce(null);

    try {
      await action({
        request,
        context: {},
        params: { username },
      });
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(403);
    }
  });

  test("profile not found", async () => {
    expect.assertions(1);
    const request = createRequestWithFormData({});

    getSessionUserOrThrow.mockResolvedValueOnce({
      id: "some-user-id",
    } as User);

    (prismaClient.profile.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-profile-id",
    });

    (prismaClient.profile.findUnique as jest.Mock).mockResolvedValueOnce(null);

    try {
      await action({
        request,
        context: {},
        params: { username },
      });
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(404);
    }
  });

  test("all fields required", async () => {
    const request = createRequestWithFormData({ name: "MINTvernetzt" });

    expect.assertions(2);

    getSessionUserOrThrow.mockResolvedValueOnce({
      id: "some-user-id",
    } as User);

    (prismaClient.profile.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-profile-id",
    });

    (prismaClient.profile.findUnique as jest.Mock).mockResolvedValueOnce({
      id: "some-profile-id",
    });

    try {
      await action({
        request,
        context: {},
        params: { username },
      });
    } catch (error) {
      const response = error as Response; //?
      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.message).toBe("error.validationFailed");
    }
  });

  describe("validate first name", () => {
    test('firstName is "undefined"', async () => {
      expect.assertions(2);
      const { firstName: _firstName, ...otherDefaults } = formDefaults;
      const request = createRequestWithFormData({
        ...otherDefaults,
      });

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

      (prismaClient.profile.findFirst as jest.Mock).mockResolvedValueOnce({
        id: "some-profile-id",
      });

      (prismaClient.profile.findUnique as jest.Mock).mockResolvedValueOnce({
        id: "some-profile-id",
      });

      const response = await action({
        request,
        context: {},
        params: { username },
      });
      const responseBody = await response.json();
      // TODO: fix type issues
      // @ts-ignore
      expect(responseBody.errors.firstName).not.toBeUndefined();
      // @ts-ignore
      expect(responseBody.errors.firstName.message).toEqual(
        expect.stringContaining("firstName must be a `string` type")
      );
    });
    test("firstName is empty", async () => {
      expect.assertions(2);
      const request = createRequestWithFormData({
        ...formDefaults,
      });

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

      (prismaClient.profile.findFirst as jest.Mock).mockResolvedValueOnce({
        id: "some-profile-id",
      });

      (prismaClient.profile.findUnique as jest.Mock).mockResolvedValueOnce({
        id: "some-profile-id",
      });

      const response = await action({
        request,
        context: {},
        params: { username },
      });
      const responseBody = await response.json();
      // TODO: fix type issues
      // @ts-ignore
      expect(responseBody.errors.firstName).not.toBeUndefined();
      // @ts-ignore
      expect(responseBody.errors.firstName.message).toEqual(
        "validation.firstName.required"
      );
    });

    test("email is invalid", async () => {
      const request = createRequestWithFormData({
        ...formDefaults,
        email: "invalid email",
      });

      expect.assertions(2);
      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

      (prismaClient.profile.findFirst as jest.Mock).mockResolvedValueOnce({
        id: "some-profile-id",
      });

      (prismaClient.profile.findUnique as jest.Mock).mockResolvedValueOnce({
        id: "some-profile-id",
      });

      const response = await action({
        request,
        context: {},
        params: { username },
      });
      const responseBody = await response.json();
      // TODO: fix type issues
      // @ts-ignore
      expect(responseBody.errors.email).not.toBeUndefined();
      // @ts-ignore
      expect(responseBody.errors.email.message).toEqual(
        expect.stringContaining("email must be a valid email")
      );
    });

    test("email is valid", async () => {
      const email = "hello@songsforthe.dev";

      const request = createRequestWithFormData({
        ...formDefaults,
        email,
      });

      expect.assertions(2);
      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

      (prismaClient.profile.findFirst as jest.Mock).mockResolvedValueOnce({
        id: "some-profile-id",
      });

      (prismaClient.profile.findUnique as jest.Mock).mockResolvedValueOnce({
        id: "some-profile-id",
      });

      const response = await action({
        request,
        context: {},
        params: { username },
      });
      const responseBody = await response.json();
      // TODO: fix type issue
      // @ts-ignore
      expect(responseBody.errors.email).toBeUndefined();
      expect(responseBody.profile.email).toBe(email);
    });
  });

  describe("submit", () => {
    test("add list item", async () => {
      const firstName = "sookie";
      const lastName = "holló";
      const email = "hello@songsforthe.dev";
      const listAction = "addArea";
      const listActionItemId = "2";

      const request = createRequestWithFormData({
        ...formDefaults,
        email,
        submit: listAction,
        firstName,
        lastName,
        [listAction]: listActionItemId,
      });

      expect.assertions(2);
      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

      (prismaClient.profile.findFirst as jest.Mock).mockResolvedValueOnce({
        id: "some-profile-id",
      });

      (prismaClient.profile.findUnique as jest.Mock).mockResolvedValueOnce({
        id: "some-profile-id",
      });

      const response = await action({
        request,
        context: {},
        params: { username },
      });

      const responseBody = await response.json();

      expect(responseBody.errors).toBeNull();
      expect(responseBody.profile.areas).toEqual([listActionItemId]);
    });

    test("update profile", async () => {
      const firstName = "sookie";
      const lastName = "holló";
      const email = "hello@songsforthe.dev";

      const request = createRequestWithFormData({
        ...formDefaults,
        submit: "submit",
        firstName,
        lastName,
        email,
      });

      expect.assertions(2);
      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

      (prismaClient.profile.findFirst as jest.Mock).mockResolvedValueOnce({
        id: "some-profile-id",
      });

      (prismaClient.profile.findUnique as jest.Mock).mockResolvedValueOnce({
        id: "some-profile-id",
      });

      const response = await action({
        request,
        context: {},
        params: { username },
      });
      const responseBody = await response.json();
      expect(responseBody.errors).toBeNull();
      const { privateFields, ...otherFields } = parsedDataDefaults;
      expect(updateProfileById).toHaveBeenCalledWith(
        "some-profile-id",
        {
          ...otherFields,
          firstName,
          lastName,
          email,
        },
        privateFields
      );
    });
  });
});
