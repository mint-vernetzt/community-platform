import { action, loader } from ".";
import { Profile } from "@prisma/client";
import { badRequest, forbidden } from "remix-utils";
import { getUser } from "../../../../auth.server";
import { updateProfileByUserId } from "~/profile.server";
import { ProfileFormType } from "../edit/yupSchema";

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
    getUser: jest.fn(),
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
    (getUser as jest.Mock).mockImplementation(() => {
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

// TODO: Tests for email and password change
