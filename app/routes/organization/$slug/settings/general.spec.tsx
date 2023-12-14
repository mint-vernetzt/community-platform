import { createRequestWithFormData, testURL } from "~/lib/utils/tests";
import { action, loader } from "./general";
import { updateOrganizationById } from "./utils.server";
import * as authServerModule from "~/auth.server";
import { type User } from "@supabase/supabase-js";
import { prismaClient } from "~/prisma.server";

/** @type {jest.Expect} */
// @ts-ignore
const expect = global.expect;

const slug = "mintvernetzt";

const fullLoaderOrganization = {
  id: "some-organization-id",
  name: "some-organization-name",
  email: "some-organization-email",
  phone: "some-organization-phone",
  street: "some-organization-street",
  streetNumber: "some-organization-street-number",
  zipCode: "some-organization-zip-code",
  city: "some-organization-city",
  bio: "some-organization-bio",
  supportedBy: ["some-organization-support"],
  quote: "some-organization-quote",
  quoteAuthor: "some-organization-quote-author",
  quoteAuthorInformation: "some-organization-quote-author-information",
  website: "some-organization-website",
  linkedin: "some-organization-linkedin",
  twitter: "some-organization-twitter",
  xing: "some-organization-xing",
  instagram: "some-organization-instagram",
  youtube: "some-organization-youtube",
  facebook: "some-organization-facebook",
  types: [
    {
      organizationTypeId: "some-organization-type-id",
    },
  ],
  areas: [
    {
      areaId: "some-area-id",
    },
  ],
  focuses: [
    {
      focusId: "some-focus-id",
    },
  ],
};

const organizationVisibilities = {
  id: true,
  name: true,
  email: true,
  phone: true,
  street: true,
  streetNumber: true,
  zipCode: true,
  city: true,
  bio: true,
  supportedBy: true,
  quote: true,
  quoteAuthor: true,
  quoteAuthorInformation: true,
  website: true,
  linkedin: true,
  twitter: true,
  xing: true,
  instagram: true,
  youtube: true,
  facebook: true,
  types: true,
  areas: true,
  focuses: true,
};

const getSessionUserOrThrow = jest.spyOn(
  authServerModule,
  "getSessionUserOrThrow"
);

jest.mock("~/prisma.server", () => {
  return {
    prismaClient: {
      organization: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
      organizationVisibility: {
        findFirst: jest.fn(),
      },
      organizationType: {
        findMany: jest.fn(),
      },
      focus: {
        findMany: jest.fn(),
      },
      area: {
        findMany: jest.fn(),
      },
    },
  };
});

jest.mock("./utils.server", () => {
  return {
    ...jest.requireActual("./utils.server"),
    updateOrganizationById: jest.fn(),
  };
});

describe("loader", () => {
  test("no params", async () => {
    expect.assertions(2);

    const request = new Request(testURL);
    try {
      await loader({ request, context: {}, params: {} });
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.message).toBe('"slug" missing');
    }
  });

  test("anon user", async () => {
    expect.assertions(2);

    try {
      await loader({
        request: new Request(testURL),
        context: {},
        params: { slug },
      });
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json.message).toBe("No session or session user found");
    }
  });

  test("authenticated user", async () => {
    expect.assertions(1);

    getSessionUserOrThrow.mockResolvedValueOnce({
      id: "some-user-id",
    } as User);

    (prismaClient.organization.findFirst as jest.Mock).mockResolvedValueOnce(
      null
    );

    try {
      await loader({
        request: new Request(testURL),
        context: {},
        params: { slug },
      });
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(403);
    }
  });

  test("organization not found", async () => {
    expect.assertions(2);
    getSessionUserOrThrow.mockResolvedValueOnce({
      id: "some-user-id",
    } as User);

    (prismaClient.organization.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-organization-id",
    });

    (prismaClient.organization.findFirst as jest.Mock).mockResolvedValueOnce(
      null
    );

    try {
      const request = new Request(testURL);
      await loader({ request, context: {}, params: { slug: slug } });
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(404);

      const json = await response.json();
      expect(json.message).toBe(`Organization with slug "${slug}" not found.`);
    }
  });
  test("organization visibilities not found", async () => {
    expect.assertions(2);
    getSessionUserOrThrow.mockResolvedValueOnce({
      id: "some-user-id",
    } as User);

    (prismaClient.organization.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-organization-id",
    });

    (prismaClient.organization.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-organization-id",
    });

    (
      prismaClient.organizationVisibility.findFirst as jest.Mock
    ).mockResolvedValueOnce(null);

    try {
      const request = new Request(testURL);
      await loader({ request, context: {}, params: { slug: slug } });
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(404);

      const json = await response.json();
      expect(json.message).toBe("organization visbilities not found.");
    }
  });
  test("admin user full loader call", async () => {
    expect.assertions(5);
    getSessionUserOrThrow.mockResolvedValueOnce({
      id: "some-user-id",
    } as User);

    (prismaClient.organization.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-organization-id",
    });

    (prismaClient.organization.findFirst as jest.Mock).mockResolvedValueOnce(
      fullLoaderOrganization
    );

    (
      prismaClient.organizationVisibility.findFirst as jest.Mock
    ).mockResolvedValueOnce(organizationVisibilities);

    (prismaClient.organizationType.findMany as jest.Mock).mockResolvedValueOnce(
      [
        {
          title: "some-organization-type-title",
        },
      ]
    );

    (prismaClient.focus.findMany as jest.Mock).mockResolvedValueOnce([
      {
        title: "some-focus-title",
      },
    ]);

    (prismaClient.area.findMany as jest.Mock).mockResolvedValueOnce([
      {
        name: "some-area-name",
      },
    ]);

    const request = new Request(testURL);
    const response = await loader({
      request,
      context: {},
      params: { slug: slug },
    });

    const responseBody = await response.json();

    expect(responseBody.organization).toStrictEqual({
      ...fullLoaderOrganization,
      areas: ["some-area-id"],
      focuses: ["some-focus-id"],
      types: ["some-organization-type-id"],
    });
    expect(responseBody.organizationVisibilities).toStrictEqual(
      organizationVisibilities
    );
    expect(responseBody.organizationTypes).toStrictEqual([
      {
        title: "some-organization-type-title",
      },
    ]);
    expect(responseBody.focuses).toStrictEqual([
      {
        title: "some-focus-title",
      },
    ]);
    expect(responseBody.areas).toStrictEqual([
      {
        name: "some-area-name",
      },
    ]);
  });
});

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
  privateFields: [],
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

describe("action", () => {
  test("no params", async () => {
    expect.assertions(2);
    const request = createRequestWithFormData({});

    try {
      await action({ request, context: {}, params: {} });
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.message).toBe('"slug" missing');
    }
  });

  test("anon user", async () => {
    expect.assertions(2);
    const request = createRequestWithFormData({});

    try {
      await action({
        request,
        context: {},
        params: { slug },
      });
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json.message).toBe("No session or session user found");
    }
  });

  test("authenticated user", async () => {
    expect.assertions(1);
    const request = createRequestWithFormData({});

    getSessionUserOrThrow.mockResolvedValueOnce({
      id: "some-user-id",
    } as User);

    (prismaClient.organization.findFirst as jest.Mock).mockResolvedValueOnce(
      null
    );

    try {
      await action({
        request,
        context: {},
        params: { slug },
      });
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(403);
    }
  });

  test("organization not found", async () => {
    expect.assertions(1);
    const request = createRequestWithFormData({});

    getSessionUserOrThrow.mockResolvedValueOnce({
      id: "some-user-id",
    } as User);

    (prismaClient.organization.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-organization-id",
    });

    (prismaClient.organization.findUnique as jest.Mock).mockResolvedValueOnce(
      null
    );

    try {
      await action({
        request,
        context: {},
        params: { slug },
      });
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(404);
    }
  });

  test("all fields required", async () => {
    const request = createRequestWithFormData({ name: "MINTvernetzt" });

    expect.assertions(2);

    getSessionUserOrThrow.mockResolvedValueOnce({
      id: "some-user-id",
    } as User);

    (prismaClient.organization.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-organization-id",
    });

    (prismaClient.organization.findUnique as jest.Mock).mockResolvedValueOnce({
      id: "some-organization-id",
    });

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
      expect.assertions(2);
      const { name: _name, ...otherDefaults } = formDefaults;
      const request = createRequestWithFormData({
        ...otherDefaults,
      });

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

      (prismaClient.organization.findFirst as jest.Mock).mockResolvedValueOnce({
        id: "some-organization-id",
      });

      (prismaClient.organization.findUnique as jest.Mock).mockResolvedValueOnce(
        {
          id: "some-organization-id",
        }
      );

      const response = await action({
        request,
        context: {},
        params: { slug: slug },
      });
      const responseBody = await response.json();
      // TODO: fix type issues
      // @ts-ignore
      expect(responseBody.errors.name).not.toBeUndefined();
      // @ts-ignore
      expect(responseBody.errors.name.message).toEqual(
        expect.stringContaining("name must be a `string` type")
      );
    });
    test("name is empty", async () => {
      expect.assertions(2);
      const request = createRequestWithFormData({
        ...formDefaults,
      });

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

      (prismaClient.organization.findFirst as jest.Mock).mockResolvedValueOnce({
        id: "some-organization-id",
      });

      (prismaClient.organization.findUnique as jest.Mock).mockResolvedValueOnce(
        {
          id: "some-organization-id",
        }
      );

      const response = await action({
        request,
        context: {},
        params: { slug: slug },
      });
      const responseBody = await response.json();
      // TODO: fix type issues
      // @ts-ignore
      expect(responseBody.errors.name).not.toBeUndefined();
      // @ts-ignore
      expect(responseBody.errors.name.message).toEqual(
        expect.stringContaining("Bitte gib Euren Namen ein.")
      );
    });

    test("email is invalid", async () => {
      const request = createRequestWithFormData({
        ...formDefaults,
        email: "invalid email",
      });

      expect.assertions(2);
      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

      (prismaClient.organization.findFirst as jest.Mock).mockResolvedValueOnce({
        id: "some-organization-id",
      });

      (prismaClient.organization.findUnique as jest.Mock).mockResolvedValueOnce(
        {
          id: "some-organization-id",
        }
      );

      const response = await action({
        request,
        context: {},
        params: { slug: slug },
      });
      const responseBody = await response.json();
      // TODO: fix type issues
      // @ts-ignore
      expect(responseBody.errors.email).not.toBeUndefined();
      // @ts-ignore
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

      expect.assertions(2);
      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

      (prismaClient.organization.findFirst as jest.Mock).mockResolvedValueOnce({
        id: "some-organization-id",
      });

      (prismaClient.organization.findUnique as jest.Mock).mockResolvedValueOnce(
        {
          id: "some-organization-id",
        }
      );

      const response = await action({
        request,
        context: {},
        params: { slug: slug },
      });
      const responseBody = await response.json();
      // TODO: fix type issue
      // @ts-ignore
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

      expect.assertions(2);
      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

      (prismaClient.organization.findFirst as jest.Mock).mockResolvedValueOnce({
        id: "some-organization-id",
      });

      (prismaClient.organization.findUnique as jest.Mock).mockResolvedValueOnce(
        {
          id: "some-organization-id",
        }
      );

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

      expect.assertions(2);
      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

      (prismaClient.organization.findFirst as jest.Mock).mockResolvedValueOnce({
        id: "some-organization-id",
      });

      (prismaClient.organization.findUnique as jest.Mock).mockResolvedValueOnce(
        {
          id: "some-organization-id",
        }
      );

      const response = await action({
        request,
        context: {},
        params: { slug: slug },
      });
      const responseBody = await response.json();
      expect(responseBody.errors).toBeNull();
      const { privateFields, ...otherFields } = parsedDataDefaults;
      expect(updateOrganizationById).toHaveBeenCalledWith(
        "some-organization-id",
        {
          ...otherFields,
          name,
        },
        privateFields
      );
    });
  });
});
