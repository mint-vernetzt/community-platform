import { User } from "@supabase/supabase-js";
import { getSessionUser } from "~/auth.server";
import { testURL } from "~/lib/utils/tests";
import { getProfileByUserId, getProfileByUsername } from "~/profile.server";
import { loader } from "./index";
import { deriveMode } from "./utils.server";

/** @type {jest.Expect} */
// @ts-ignore
const expect = global.expect;

const path = "/profile/$username";

jest.mock("~/auth.server", () => {
  return {
    // eslint-disable-next-line
    getSessionUser: jest.fn(),
  };
});

jest.mock("./utils.server", () => {
  return {
    ...jest.requireActual("./utils.server"),
    // eslint-disable-next-line
    prepareProfileEvents: jest.fn(),
  };
});

jest.mock("~/profile.server", () => {
  return {
    // eslint-disable-next-line
    getProfileByUsername: jest.fn(),
    // eslint-disable-next-line
    getProfileByUserId: jest.fn(),
  };
});

jest.mock("~/lib/event/utils", () => {
  return {
    // eslint-disable-next-line
    addUserParticipationStatus: jest.fn(),
    // eslint-disable-next-line
    combineEventsSortChronologically: jest.fn(),
  };
});

const profile = {
  username: "username",
  firstName: "User",
  lastName: "Name",
  email: "user.name@company.com",
  phone: "+49 0123 456 78",
  publicFields: ["email"],
  avatar: null,
  background: null,
  memberOf: [],
  teamMemberOfProjects: [],
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
    expect.assertions(6);

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
      expect(json).toEqual({ message: "Username must be provided" });
    }

    try {
      await loader({
        request: new Request(testURL),
        params: { username: "" },
        context: {},
      });
    } catch (error) {
      expect(error instanceof Response).toBe(true);

      const response = error as Response;
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toEqual({ message: "Username must be provided" });
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
  });

  test("receive only public data", async () => {
    const res = await loader({
      request: new Request(`${testURL}/${path}`),
      params: { username: profile.username },
      context: {},
    });

    const json = await res.json();

    const { mode, data } = json;

    expect(mode).toEqual("anon");

    expect(data).toMatchObject({
      username: profile.username,
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
    });

    expect(data).not.toMatchObject({
      phone: profile.phone,
    });

    (getProfileByUsername as jest.Mock).mockReset();
  });

  afterAll(() => {
    (getSessionUser as jest.Mock).mockReset();
    (getProfileByUsername as jest.Mock).mockReset();
  });
});

describe("get profile (authenticated)", () => {
  const sessionUsername = "anotherusername";

  beforeAll(() => {
    (getSessionUser as jest.Mock).mockImplementation(() => {
      return { user_metadata: { username: sessionUsername } };
    });
    (getProfileByUsername as jest.Mock).mockImplementation(() => profile);
    (getProfileByUserId as jest.Mock).mockImplementation(() => {
      return {
        username: sessionUsername,
      };
    });
  });
  test("can read all fields", async () => {
    const res = await loader({
      request: new Request(`${testURL}/${path}`),
      params: { username: profile.username },
      context: {},
    });

    const json = await res.json();

    const { mode, data } = json;

    expect(mode).toEqual("authenticated");

    expect(data).toMatchObject({
      email: profile.email,
      phone: profile.phone,
    });
  });

  afterAll(() => {
    (getSessionUser as jest.Mock).mockReset();
    (getProfileByUsername as jest.Mock).mockReset();
    (getProfileByUserId as jest.Mock).mockReset();
  });
});

describe("get profile (owner)", () => {
  beforeAll(() => {
    (getSessionUser as jest.Mock).mockImplementation(() => {
      return { user_metadata: { username: profile.username } };
    });
    (getProfileByUsername as jest.Mock).mockImplementation(() => profile);
    (getProfileByUserId as jest.Mock).mockImplementation(() => profile);
  });

  test("can read all fields", async () => {
    const res = await loader({
      request: new Request(`${testURL}/${path}`),
      params: { username: profile.username },
      context: {},
    });

    const json = await res.json();

    const { mode, data } = json;

    expect(mode).toEqual("owner");

    expect(data).toMatchObject({
      email: profile.email,
      phone: profile.phone,
    });
  });

  afterAll(() => {
    (getSessionUser as jest.Mock).mockReset();
    (getProfileByUsername as jest.Mock).mockReset();
    (getProfileByUserId as jest.Mock).mockReset();
  });
});
