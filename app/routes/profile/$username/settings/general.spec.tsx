import type { User } from "@supabase/supabase-js";
import * as authServerModule from "~/auth.server";
import { createRequestWithFormData, testURL } from "~/lib/utils/tests";
import { getProfileByUsername } from "~/profile.server";
import {
  getWholeProfileFromUsername,
  updateProfileById,
} from "../utils.server";
import { action, loader } from "./general";

/** @type {jest.Expect} */
// @ts-ignore
const expect = global.expect;

const id = "1";
const username = "sookie";

const getSessionUserOrThrow = jest.spyOn(
  authServerModule,
  "getSessionUserOrThrow"
);

jest.mock("../utils.server", () => {
  return {
    getWholeProfileFromUsername: jest.fn(),
    handleAuthorization: jest.fn().mockResolvedValue({ id }),
    updateProfileById: jest.fn(),
  };
});

jest.mock("~/profile.server", () => {
  return { getAllOffers: jest.fn(), getProfileByUsername: jest.fn() };
});

jest.mock("~/utils.server", () => {
  return {
    getAreas: jest.fn(),
  };
});

describe("loader", () => {
  test("no profile found in db", async () => {
    (getWholeProfileFromUsername as jest.Mock).mockImplementationOnce(() => {
      return null;
    });

    expect.assertions(2);

    try {
      const request = new Request(testURL);
      await loader({ request, context: {}, params: { username } });
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(404);

      const json = await response.json();
      expect(json.message).toBe("profile not found.");
    }
  });
  test("profile found", async () => {
    const profile = { id, areas: [], offers: [], seekings: [] };

    getSessionUserOrThrow.mockResolvedValue({ id: "some-user-id" } as User);

    (getWholeProfileFromUsername as jest.Mock).mockReturnValueOnce(profile);

    const request = new Request(testURL);
    const response = await loader({
      request,
      context: {},
      params: { username },
    });

    const responseBody = await response.json();

    expect(responseBody.profile).toEqual(profile);
  });
  test("flatten areas, offers and seekings", async () => {
    (getWholeProfileFromUsername as jest.Mock).mockReturnValueOnce({
      id,
      areas: [{ area: { id: "area1" } }, { area: { id: "area2" } }],
      offers: [{ offer: { id: "offer1" } }],
      seekings: [
        { offer: { id: "offer1" } },
        { offer: { id: "offer2" } },
        { offer: { id: "offer3" } },
      ],
    });

    const request = new Request(testURL);
    const response = await loader({
      request,
      context: {},
      params: { username },
    });

    const responseBody = await response.json();

    expect(responseBody.profile.areas).toEqual(["area1", "area2"]);
    expect(responseBody.profile.offers).toEqual(["offer1"]);
    expect(responseBody.profile.seekings).toEqual([
      "offer1",
      "offer2",
      "offer3",
    ]);
  });
});

describe("action", () => {
  const formDefaults = {
    academicTitle: "",
    position: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    bio: "",
    website: "",
    facebook: "",
    linkedin: "",
    twitter: "",
    youtube: "",
    instagram: "",
    xing: "",
    areas: [],
    skills: [],
    offers: [],
    interests: [],
    seekings: [],
    privateFields: [],
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

  test("all fields required", async () => {
    const request = createRequestWithFormData({ firstName: "First Name" });

    expect.assertions(2);

    (getProfileByUsername as jest.Mock).mockImplementationOnce(() => {
      return { id: "some-user-id" };
    });

    try {
      await action({
        request,
        context: {},
        params: { username },
      });
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.message).toBe("Validation failed");
    }
  });

  describe("validate email", () => {
    test('email is "undefined"', async () => {
      const { email: _email, ...otherDefaults } = formDefaults;
      const request = createRequestWithFormData({
        ...otherDefaults,
      });

      (getProfileByUsername as jest.Mock).mockImplementationOnce(() => {
        return { id: "some-user-id" };
      });

      const response = await action({
        request,
        context: {},
        params: { username },
      });
      const responseBody = await response.json();
      expect(responseBody.errors.email).not.toBeUndefined();
      expect(responseBody.errors.email.message).toEqual(
        expect.stringContaining("email must be a `string` type")
      );
    });
    test("email is empty", async () => {
      const request = createRequestWithFormData({
        ...formDefaults,
      });

      (getProfileByUsername as jest.Mock).mockImplementationOnce(() => {
        return { id: "some-user-id" };
      });

      const response = await action({
        request,
        context: {},
        params: { username },
      });
      const responseBody = await response.json();
      expect(responseBody.errors.email).not.toBeUndefined();
      expect(responseBody.errors.email.message).toEqual(
        expect.stringContaining("email is a required field")
      );
    });

    test("email is invalid", async () => {
      const request = createRequestWithFormData({
        ...formDefaults,
        email: "invalid email",
      });
      (getProfileByUsername as jest.Mock).mockImplementationOnce(() => {
        return { id: "some-user-id" };
      });

      const response = await action({
        request,
        context: {},
        params: { username },
      });
      const responseBody = await response.json();
      expect(responseBody.errors.email).not.toBeUndefined();
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
      (getProfileByUsername as jest.Mock).mockImplementationOnce(() => {
        return { id: "some-user-id" };
      });

      const response = await action({
        request,
        context: {},
        params: { username },
      });
      const responseBody = await response.json();
      expect(responseBody.errors.email).toBeUndefined();
      expect(responseBody.profile.email).toBe(email);
    });
  });

  describe("submit", () => {
    test("add list item", async () => {
      const email = "hello@songsforthe.dev";
      const firstName = "First Name";
      const lastName = "Last Name";
      const listAction = "addArea";
      const listActionItemId = "2";

      const request = createRequestWithFormData({
        ...formDefaults,
        submit: listAction,
        email,
        firstName,
        lastName,
        [listAction]: listActionItemId,
      });
      (getProfileByUsername as jest.Mock).mockImplementationOnce(() => {
        return { id: "some-user-id" };
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
      const email = "hello@songsforthe.dev";
      const firstName = "First Name";
      const lastName = "Last Name";

      const request = createRequestWithFormData({
        ...formDefaults,
        submit: "submit",
        email,
        firstName,
        lastName,
      });
      getSessionUserOrThrow.mockResolvedValue({ id: id } as User);
      (getProfileByUsername as jest.Mock).mockImplementationOnce(() => {
        return { id: id };
      });
      const response = await action({
        request,
        context: {},
        params: { username },
      });
      const responseBody = await response.json();
      expect(responseBody.errors).toBeNull();
      expect(updateProfileById).toHaveBeenLastCalledWith(id, {
        ...parsedDataDefaults,
        email,
        firstName,
        lastName,
      });
    });
  });
});
