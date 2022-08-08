import { createRequestWithFormData } from "~/lib/utils/tests";
import { action, loader } from "./general";
import { getWholeProfileFromId, updateProfileById } from "./utils.server";

/** @type {jest.Expect} */
// @ts-ignore
const expect = global.expect;

const id = "1";
const username = "sookie";

jest.mock("./utils.server", () => {
  return {
    getWholeProfileFromId: jest.fn(),
    handleAuthorization: jest.fn().mockResolvedValue({ id }),
    updateProfileById: jest.fn(),
  };
});

jest.mock("~/profile.server", () => {
  return { getAllOffers: jest.fn(), getAreas: jest.fn() };
});

describe("loader", () => {
  test("no profile found in db", async () => {
    (getWholeProfileFromId as jest.Mock).mockImplementationOnce(() => {
      return null;
    });

    expect.assertions(2);

    try {
      const request = new Request("");
      await loader({ request, context: {}, params: { username } });
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(404);

      const json = await response.json();
      expect(json.message).toBe("Profile not found");
    }
  });
  test("profile found", async () => {
    const profile = { id, areas: [], offers: [], seekings: [] };

    (getWholeProfileFromId as jest.Mock).mockReturnValueOnce(profile);

    const request = new Request("");
    const response = await loader({
      request,
      context: {},
      params: { username },
    });

    expect(response.profile).toEqual(profile);
  });
  test("flatten areas, offers and seekings", async () => {
    (getWholeProfileFromId as jest.Mock).mockReturnValueOnce({
      id,
      areas: [{ area: { id: "area1" } }, { area: { id: "area2" } }],
      offers: [{ offer: { id: "offer1" } }],
      seekings: [
        { offer: { id: "offer1" } },
        { offer: { id: "offer2" } },
        { offer: { id: "offer3" } },
      ],
    });

    const request = new Request("");
    const response = await loader({
      request,
      context: {},
      params: { username },
    });

    expect(response.profile.areas).toEqual(["area1", "area2"]);
    expect(response.profile.offers).toEqual(["offer1"]);
    expect(response.profile.seekings).toEqual(["offer1", "offer2", "offer3"]);
  });
});

jest.mock("~/utils.server", () => {
  return {
    validateCSRFToken: jest.fn(),
  };
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
    publicFields: [],
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

      const response = await action({
        request,
        context: {},
        params: { username },
      });
      expect(response.errors.email).not.toBeUndefined();
      expect(response.errors.email.message).toEqual(
        expect.stringContaining("email must be a `string` type")
      );
    });
    test("email is empty", async () => {
      const request = createRequestWithFormData({
        ...formDefaults,
      });

      const response = await action({
        request,
        context: {},
        params: { username },
      });
      expect(response.errors.email).not.toBeUndefined();
      expect(response.errors.email.message).toEqual(
        expect.stringContaining("email is a required field")
      );
    });

    test("email is invalid", async () => {
      const request = createRequestWithFormData({
        ...formDefaults,
        email: "invalid email",
      });

      const response = await action({
        request,
        context: {},
        params: { username },
      });
      expect(response.errors.email).not.toBeUndefined();
      expect(response.errors.email.message).toEqual(
        expect.stringContaining("email must be a valid email")
      );
    });

    test("email is valid", async () => {
      const email = "hello@songsforthe.dev";

      const request = createRequestWithFormData({
        ...formDefaults,
        email,
      });

      const response = await action({
        request,
        context: {},
        params: { username },
      });
      expect(response.errors.email).toBeUndefined();
      expect(response.profile.email).toBe(email);
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
      const response = await action({
        request,
        context: {},
        params: { username },
      });

      expect(response.errors).toBeNull();
      expect(response.profile.areas).toEqual([listActionItemId]);
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
      const response = await action({
        request,
        context: {},
        params: { username },
      });
      expect(response.errors).toBeNull();
      expect(updateProfileById).toHaveBeenCalledWith(id, {
        ...parsedDataDefaults,
        email,
        firstName,
        lastName,
      });
    });
  });
});
