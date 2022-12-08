import { createRequestWithFormData, testURL } from "~/lib/utils/tests";
import { action, loader } from "./general";
import {
  getWholeOrganizationBySlug,
  updateOrganizationById,
} from "./utils.server";

/** @type {jest.Expect} */
// @ts-ignore
const expect = global.expect;

const id = "1";
const organization = {
  id: "1",
};
const slug = "mintvernetzt";

jest.mock("./utils.server", () => {
  return {
    getWholeOrganizationBySlug: jest.fn(),
    handleAuthorization: jest.fn().mockResolvedValue({ organization, slug }),
    updateOrganizationById: jest.fn(),
    getOrganizationTypes: jest.fn(),
  };
});

jest.mock("~/utils.server", () => {
  return {
    getAreas: jest.fn(),
    getFocuses: jest.fn(),
  };
});

describe("loader", () => {
  test("no organization found in db", async () => {
    (getWholeOrganizationBySlug as jest.Mock).mockImplementationOnce(() => {
      return null;
    });

    expect.assertions(2);

    try {
      const request = new Request(testURL);
      await loader({ request, context: {}, params: { slug: slug } });
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

    const request = new Request(testURL);
    const response = await loader({
      request,
      context: {},
      params: { slug: slug },
    });

    const responseBody = await response.json();

    expect(responseBody.organization).toEqual(organization);
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

    const request = new Request(testURL);
    const response = await loader({
      request,
      context: {},
      params: { slug: slug },
    });

    const responseBody = await response.json();

    expect(responseBody.organization.areas).toEqual(["area1", "area2"]);
    expect(responseBody.organization.types).toEqual(["type1"]);
    expect(responseBody.organization.focuses).toEqual([
      "focus1",
      "focus2",
      "focus3",
    ]);
  });
});

describe("action", () => {
  const formDefaults = {
    name: "",
    email: "",
    phone: "",
    street: "",
    streetNumber: "",
    zipCode: "",
    city: "",
    website: "",
    facebook: "",
    linkedin: "",
    twitter: "",
    youtube: "",
    instagram: "",
    xing: "",
    bio: "",
    types: [],
    quote: "",
    quoteAuthor: "",
    quoteAuthorInformation: "",
    supportedBy: [],
    publicFields: [],
    areas: [],
    focuses: [],
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
    const request = createRequestWithFormData({ name: "MINTvernetzt" });

    expect.assertions(2);

    try {
      await action({
        request,
        context: {},
        params: { slug: slug },
      });
    } catch (error) {
      const response = error as Response; //?
      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.message).toBe("Validation failed");
    }
  });

  describe("validate name", () => {
    test('name is "undefined"', async () => {
      const { name: _name, ...otherDefaults } = formDefaults;
      const request = createRequestWithFormData({
        ...otherDefaults,
      });

      const response = await action({
        request,
        context: {},
        params: { slug: slug },
      });
      const responseBody = await response.json();
      expect(responseBody.errors.name).not.toBeUndefined();
      expect(responseBody.errors.name.message).toEqual(
        expect.stringContaining("name must be a `string` type")
      );
    });
    test("name is empty", async () => {
      const request = createRequestWithFormData({
        ...formDefaults,
      });

      const response = await action({
        request,
        context: {},
        params: { slug: slug },
      });
      const responseBody = await response.json();
      expect(responseBody.errors.name).not.toBeUndefined();
      expect(responseBody.errors.name.message).toEqual(
        expect.stringContaining("Bitte gib Euren Namen ein.")
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
        params: { slug: slug },
      });
      const responseBody = await response.json();
      expect(responseBody.errors.email).not.toBeUndefined();
      expect(responseBody.errors.email.message).toEqual(
        expect.stringContaining(
          "Deine Eingabe entspricht nicht dem Format einer E-Mail."
        )
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
        params: { slug: slug },
      });
      const responseBody = await response.json();
      expect(responseBody.errors.email).toBeUndefined();
      expect(responseBody.organization.email).toBe(email);
    });
  });

  describe("submit", () => {
    test("add list item", async () => {
      const name = "MINTvernetzt";
      const listAction = "addArea";
      const listActionItemId = "2";

      const request = createRequestWithFormData({
        ...formDefaults,
        submit: listAction,
        name,
        [listAction]: listActionItemId,
      });
      const response = await action({
        request,
        context: {},
        params: { slug: slug },
      });

      const responseBody = await response.json();

      expect(responseBody.errors).toBeNull();
      expect(responseBody.organization.areas).toEqual([listActionItemId]);
    });

    test("update organization", async () => {
      const name = "MINTvernetzt";

      const request = createRequestWithFormData({
        ...formDefaults,
        submit: "submit",
        name,
      });
      const response = await action({
        request,
        context: {},
        params: { slug: slug },
      });
      const responseBody = await response.json();
      expect(responseBody.errors).toBeNull();
      expect(updateOrganizationById).toHaveBeenCalledWith(id, {
        ...parsedDataDefaults,
        name,
      });
    });
  });
});
