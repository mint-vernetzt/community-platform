import { Profile } from "@prisma/client";
import { badRequest, notFound } from "remix-utils";
import { getProfileByUsername } from "~/profile.server";
import { getUser } from "~/auth.server";
import { loader } from "./index";

// @ts-ignore
const expect = global.expect as jest.Expect;

const path = "/profile/$username";

jest.mock("~/auth.server", () => {
  return {
    // eslint-disable-next-line
    getUser: jest.fn(),
  };
});

jest.mock("~/profile.server", () => {
  return {
    // eslint-disable-next-line
    getProfileByUsername: jest.fn(),
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

describe("errors", () => {
  beforeAll(() => {
    (getUser as jest.Mock).mockImplementation(() => null);
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
    (getUser as jest.Mock).mockReset();
    (getProfileByUsername as jest.Mock).mockReset();
  });
});

describe("get profile (anon)", () => {
  beforeAll(() => {
    (getUser as jest.Mock).mockImplementation(() => null);
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
    (getUser as jest.Mock).mockReset();
    (getProfileByUsername as jest.Mock).mockReset();
  });
});

describe("get profile (authenticated)", () => {
  beforeAll(() => {
    (getUser as jest.Mock).mockImplementation(() => {
      return { user_metadata: { username: "anotherusername" } };
    });
    (getProfileByUsername as jest.Mock).mockImplementation(() => profile);
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
    (getUser as jest.Mock).mockReset();
    (getProfileByUsername as jest.Mock).mockReset();
  });
});

describe("get profile (owner)", () => {
  beforeAll(() => {
    (getUser as jest.Mock).mockImplementation(() => {
      return { user_metadata: { username: profile.username } };
    });
    (getProfileByUsername as jest.Mock).mockImplementation(() => profile);
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
    (getUser as jest.Mock).mockReset();
    (getProfileByUsername as jest.Mock).mockReset();
  });
});
