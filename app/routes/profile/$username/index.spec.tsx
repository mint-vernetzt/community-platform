import { Profile } from "@prisma/client";
import { badRequest, notFound } from "remix-utils";
import { getProfileByUsername, getProfileByUserId } from "~/profile.server";
import { getUserByRequest } from "~/auth.server";
import { deriveMode, loader } from "./index";

/** @type {jest.Expect} */
// @ts-ignore
const expect = global.expect;

const path = "/profile/$username";

jest.mock("~/auth.server", () => {
  return {
    // eslint-disable-next-line
    getUserByRequest: jest.fn(),
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

const profile: Partial<Profile> = {
  username: "username",
  firstName: "User",
  lastName: "Name",
  email: "user.name@company.com",
  phone: "+49 0123 456 78",
  publicFields: ["email"],
};

test("deriveMode", () => {
  expect(deriveMode("profileUser", "sessionUser")).toBe("authenticated");
  expect(deriveMode("sessionUser", "sessionUser")).toBe("owner");
  expect(deriveMode("profileUser", "")).toBe("anon");
});

describe("errors", () => {
  beforeAll(() => {
    (getUserByRequest as jest.Mock).mockImplementation(() => null);
    (getProfileByUsername as jest.Mock).mockImplementation(() => null);
  });
  test("empty username", async () => {
    expect.assertions(4);

    try {
      await loader({
        request: new Request(path),
        params: {},
        context: {},
      });
    } catch (error) {
      expect(error instanceof Response).toBe(true);
      expect(error).toStrictEqual(
        badRequest({ message: "Username must be provided" })
      );
    }

    try {
      await loader({
        request: new Request(path),
        params: { username: "" },
        context: {},
      });
    } catch (error) {
      expect(error instanceof Response).toBe(true);
      expect(error).toStrictEqual(
        badRequest({ message: "Username must be provided" })
      );
    }
  });

  test("profile doesn't exists", async () => {
    expect.assertions(2);
    try {
      await loader({
        request: new Request(path),
        params: { username: "notexists" },
        context: {},
      });
    } catch (error) {
      expect(error instanceof Response).toBe(true);
      expect(error).toStrictEqual(notFound({ message: "Not found" }));
    }
  });

  afterAll(() => {
    (getUserByRequest as jest.Mock).mockReset();
    (getProfileByUsername as jest.Mock).mockReset();
  });
});

describe("get profile (anon)", () => {
  beforeAll(() => {
    (getUserByRequest as jest.Mock).mockImplementation(() => null);
    (getProfileByUsername as jest.Mock).mockImplementation(() => profile);
  });

  test("receive only public data", async () => {
    const res = await loader({
      request: new Request(path),
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
    (getUserByRequest as jest.Mock).mockReset();
    (getProfileByUsername as jest.Mock).mockReset();
  });
});

describe("get profile (authenticated)", () => {
  const sessionUsername = "anotherusername";

  beforeAll(() => {
    (getUserByRequest as jest.Mock).mockImplementation(() => {
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
      request: new Request(path),
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
    (getUserByRequest as jest.Mock).mockReset();
    (getProfileByUsername as jest.Mock).mockReset();
    (getProfileByUserId as jest.Mock).mockReset();
  });
});

describe("get profile (owner)", () => {
  beforeAll(() => {
    (getUserByRequest as jest.Mock).mockImplementation(() => {
      return { user_metadata: { username: profile.username } };
    });
    (getProfileByUsername as jest.Mock).mockImplementation(() => profile);
    (getProfileByUserId as jest.Mock).mockImplementation(() => profile);
  });

  test("can read all fields", async () => {
    const res = await loader({
      request: new Request(path),
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
    (getUserByRequest as jest.Mock).mockReset();
    (getProfileByUsername as jest.Mock).mockReset();
    (getProfileByUserId as jest.Mock).mockReset();
  });
});
