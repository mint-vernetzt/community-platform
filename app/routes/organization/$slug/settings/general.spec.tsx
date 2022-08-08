import { createRequestWithFormData } from "~/lib/utils/tests";
import { action, loader } from "./general";
import { getWholeOrganizationBySlug } from "./utils.server";

/** @type {jest.Expect} */
// @ts-ignore
const expect = global.expect;

const id = "1";
const slug = "mintvernetzt";

jest.mock("./utils.server", () => {
  return {
    getWholeOrganizationBySlug: jest.fn(),
    handleAuthorization: jest.fn().mockResolvedValue({ id }),
    updateOrganizationById: jest.fn(),
    getAreas: jest.fn(),
    getFocuses: jest.fn(),
    getOrganizationTypes: jest.fn(),
  };
});

describe("loader", () => {
  test("no organization found in db", async () => {
    (getWholeOrganizationBySlug as jest.Mock).mockImplementationOnce(() => {
      return null;
    });

    expect.assertions(2);

    try {
      const request = new Request("");
      await loader({ request, context: {}, params: { username: slug } });
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(404);

      const json = await response.json();
      expect(json.message).toBe(
        `Organization with slug "${slug}" not found or not permitted to edit.`
      );
    }
  });
  test("organization found", async () => {
    const organization = { id, areas: [], focuses: [], types: [] };

    (getWholeOrganizationBySlug as jest.Mock).mockReturnValueOnce(organization);

    const request = new Request("");
    const response = await loader({
      request,
      context: {},
      params: { slug: slug },
    });

    expect(response.organization).toEqual(organization);
  });
  test("flatten areas, focuses and types", async () => {
    (getWholeOrganizationBySlug as jest.Mock).mockReturnValueOnce({
      id,
      areas: [{ areaId: "area1" }, { areaId: "area2" }],
      types: [{ organizationTypeId: "type1" }],
      focuses: [
        { focusId: "focus1" },
        { focusId: "focus2" },
        { focusId: "focus3" },
      ],
    });

    const request = new Request("");
    const response = await loader({
      request,
      context: {},
      params: { slug: slug },
    });

    expect(response.organization.areas).toEqual(["area1", "area2"]);
    expect(response.organization.types).toEqual(["type1"]);
    expect(response.organization.focuses).toEqual([
      "focus1",
      "focus2",
      "focus3",
    ]);
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
        params: { username: slug },
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
        params: { username: slug },
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
        params: { username: slug },
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
        params: { username: slug },
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
        params: { username: slug },
      });
      expect(response.errors.email).toBeUndefined();
      expect(response.profile.email).toBe(email);
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
        params: { username: slug },
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
        params: { username: slug },
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
        params: { username: slug },
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
