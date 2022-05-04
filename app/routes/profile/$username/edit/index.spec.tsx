import { action, loader } from ".";
import { Profile } from "@prisma/client";
import { badRequest, forbidden } from "remix-utils";
import { getUser } from "../../../../auth.server";
import { updateProfileByUserId } from "~/profile.server";

/** @type {jest.Expect} */
// @ts-ignore
const expect = global.expect;

jest.mock("../../../../auth.server", () => {
  return {
    // eslint-disable-next-line
    getUser: jest.fn(),
  };
});

jest.mock("../../../../profile.server.ts", () => {
  return {
    // eslint-disable-next-line
    getProfileByUsername: jest.fn().mockImplementation(() => {
      return { firstName: "sessionusername" };
    }),
    updateProfileByUserId: jest.fn(),
  };
});

describe("Get profile data of specific user", () => {
  beforeAll(() => {
    (getUser as jest.Mock).mockImplementation(() => {
      return { user_metadata: { username: "sessionusername" } };
    });
  });

  test.skip("reset not yet saved form data", () => {});

  test("loader returns profile data", async () => {
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
    (getUser as jest.Mock).mockImplementation(() => {
      return { user_metadata: { username: "sessionusername" } };
    });
  });

  test("session user changes data", async () => {
    const partialProfile: Partial<Profile> = {
      firstName: "updated firstname",
      lastName: "updated lastname",
      publicFields: ["firstName"],
    };

    const formData = new FormData();
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

    expect(updateProfileByUserId).toHaveBeenCalledWith(
      "sessionusername",
      partialProfile
    );
  });
});
