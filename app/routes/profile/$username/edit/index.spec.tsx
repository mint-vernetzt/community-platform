import { action, loader } from ".";
import { Profile } from "@prisma/client";
import { badRequest, forbidden } from "remix-utils";
import { getUserByRequest } from "../../../../auth.server";
import { updateProfileByUserId } from "~/profile.server";
import { ProfileFormType } from "./yupSchema";

/** @type {jest.Expect} */
// @ts-ignore
const expect = global.expect;

jest.mock("./index", () => {
  const originalModule = jest.requireActual(".");
  // eslint-disable-next-line
  return {
    ...originalModule,
    handleAuthorization: jest.fn(),
  };
});

jest.mock("../../../../auth.server", () => {
  return {
    // eslint-disable-next-line
    getUserByRequest: jest.fn(),
  };
});

jest.mock("../../../../profile.server.ts", () => {
  return {
    // eslint-disable-next-line
    getProfileByUserId: jest.fn().mockImplementation(() => {
      return { firstName: "sessionusername", areas: [] };
    }),
    updateProfileByUserId: jest.fn(),
    getAreas: jest.fn().mockReturnValue([]),
  };
});

describe("Get profile data of specific user", () => {
  beforeEach(() => {
    (getUserByRequest as jest.Mock).mockImplementation(() => {
      return { user_metadata: { username: "sessionusername" } };
    });
  });

  test.skip("reset not yet saved form data", () => {});

  test.skip("loader returns profile data", async () => {
    const response: Response = await loader({
      request: new Request("/profile/sessionusername/edit", {
        method: "GET",
      }),
      params: {
        username: "sessionusername",
      },
      context: {},
    });

    const profileData: Profile = await response.json();
    expect(profileData).toStrictEqual({
      firstName: "sessionusername",
    });
  });

  test("session user is not profile owner", async () => {
    expect.assertions(1);
    expect(
      loader({
        request: new Request("/profile/notsessionuser/edit", {
          method: "GET",
        }),
        params: {
          username: "notsessionuser",
        },
        context: {},
      })
    ).rejects.toStrictEqual(forbidden({ message: "not allowed" }));
  });

  test("call loader with empty username", async () => {
    // scenario should never happen in remix context
    expect(
      loader({
        request: new Request("/profile/NOUSERNAME/edit", {
          method: "GET",
        }),
        params: {},
        context: {},
      })
    ).rejects.toStrictEqual(
      badRequest({ message: "username must be provided" })
    );
  });
});

describe("submit profile changes", () => {
  beforeAll(() => {
    (getUserByRequest as jest.Mock).mockImplementation(() => {
      return { user_metadata: { username: "sessionusername" } };
    });
  });

  test.skip("session user changes data", async () => {
    const partialProfile: ProfileFormType = {
      academicTitle: "",
      position: "",
      email: "name@domain.tld",
      bio: "",
      phone: "",
      firstName: "updated firstname",
      lastName: "updated lastname",
      publicFields: ["firstName"],
      areas: [],
      interests: [],
      offers: [],
      seekings: [],
      website: "",
      skills: [],
      facebook: "",
      linkedin: "",
      twitter: "",
      xing: "",
    };

    const formData = new FormData();
    formData.append("submit", "submit");
    Object.entries(partialProfile).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => formData.append(key, v));
      } else {
        formData.append(key, value as string);
      }
    });

    await action({
      request: new Request("/profile/sessionusername/edit", {
        method: "POST",
        body: formData,
      }),
      params: {
        username: "sessionusername",
      },
      context: {},
    });

    const partialProfileWithoutEMail = { ...partialProfile };
    delete partialProfileWithoutEMail["email"];

    expect(updateProfileByUserId).toHaveBeenCalled();
  });
});
