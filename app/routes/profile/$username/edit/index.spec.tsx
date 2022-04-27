import * as authServer from "../../../../auth.server";
import { loader } from ".";
import { Profile } from "@prisma/client";

/** @type {jest.Expect} */
// @ts-ignore
const expect = global.expect;

jest.mock("../../../../auth.server", () => {
  return {
    // eslint-disable-next-line
    getUser: jest.fn().mockImplementation(() => {
      return { user_metadata: { username: "sessionusername" } };
    }),
  };
});

//const mock = jest.spyOn(authServer, "getUser");

describe("Get profile data of specific user", () => {
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
      firstName: "Manuel",
    });
  });

  test("session user is not profile owner", async () => {
    const response: Response = await loader({
      request: new Request("/profile/notsessionuser/edit", {
        method: "GET",
      }),
      params: {},
      context: {},
    });

    expect(response.status).toBe(403);
  });
});
