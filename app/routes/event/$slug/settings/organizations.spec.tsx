import type { User } from "@supabase/supabase-js";
import * as authServerModule from "~/auth.server";
import { testURL } from "~/lib/utils/tests";
import { prismaClient } from "~/prisma.server";
import { loader } from "./organizations";
import * as imageServerModule from "~/images.server";

// @ts-ignore
const expect = global.expect as jest.Expect;

const getSessionUserOrThrow = jest.spyOn(
  authServerModule,
  "getSessionUserOrThrow"
);

const getImageURL = jest.spyOn(imageServerModule, "getImageURL");

const slug = "slug-test";

jest.mock("~/prisma.server", () => {
  return {
    prismaClient: {
      event: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
      organization: {
        findMany: jest.fn(),
      },
    },
  };
});

jest.mock("~/lib/utils/application", () => {
  return {
    checkFeatureAbilitiesOrThrow: jest.fn(),
  };
});

describe("/event/$slug/settings/organizations", () => {
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

  test("event not found", async () => {
    expect.assertions(1);

    getSessionUserOrThrow.mockResolvedValue({ id: "some-user-id" } as User);

    (prismaClient.event.findUnique as jest.Mock).mockResolvedValue(null);

    const request = new Request(testURL);
    try {
      await loader({ request, context: {}, params: { slug } });
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(404);
    }
  });

  test("authenticated user", async () => {
    expect.assertions(1);

    getSessionUserOrThrow.mockResolvedValue({ id: "some-user-id" } as User);

    (prismaClient.event.findUnique as jest.Mock).mockImplementationOnce(() => {
      return { slug };
    });

    (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
      return null;
    });

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

  test("admin user without autocomplete query", async () => {
    expect.assertions(4);

    getSessionUserOrThrow.mockResolvedValue({ id: "some-user-id" } as User);

    (prismaClient.event.findUnique as jest.Mock).mockImplementationOnce(() => {
      return {
        id: "some-event-id",
        published: true,
        responsibleOrganizations: [
          {
            organization: {
              id: "already-organization-id",
              slug: "already-organization-slug",
              logo: null,
              name: "already-organization-name",
              types: [
                {
                  organizationType: {
                    title: "already-organization-type-title",
                  },
                },
              ],
            },
          },
        ],
      };
    });

    (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
      return {
        id: "some-event-id",
      };
    });

    (prismaClient.organization.findMany as jest.Mock).mockImplementationOnce(
      () => {
        return [
          {
            id: "own-organization-id",
            logo: null,
            name: "own-organization-name",
            slug: "own-organization-slug",
            types: [
              {
                organizationType: {
                  title: "own-organization-type-title",
                },
              },
            ],
          },
        ];
      }
    );

    const response = await loader({
      request: new Request(testURL),
      context: {},
      params: { slug },
    });

    const responseBody = await response.json();

    expect(responseBody.published).toBe(true);
    expect(responseBody.responsibleOrganizations).toStrictEqual([
      {
        id: "already-organization-id",
        slug: "already-organization-slug",
        logo: null,
        name: "already-organization-name",
        types: [
          {
            organizationType: {
              title: "already-organization-type-title",
            },
          },
        ],
      },
    ]);
    expect(responseBody.ownOrganizationsSuggestions).toStrictEqual([
      {
        id: "own-organization-id",
        logo: null,
        name: "own-organization-name",
        slug: "own-organization-slug",
        types: [
          {
            organizationType: {
              title: "own-organization-type-title",
            },
          },
        ],
      },
    ]);
    expect(responseBody.responsibleOrganizationSuggestions).toBe(undefined);
  });

  test("admin user with autocomplete query", async () => {
    expect.assertions(4);

    getSessionUserOrThrow.mockResolvedValue({ id: "some-user-id" } as User);

    (prismaClient.event.findUnique as jest.Mock).mockImplementationOnce(() => {
      return {
        id: "some-event-id",
        published: true,
        responsibleOrganizations: [
          {
            organization: {
              id: "already-organization-id",
              slug: "already-organization-slug",
              logo: "already-organization-logo-path",
              name: "already-organization-name",
              types: [
                {
                  organizationType: {
                    title: "already-organization-type-title",
                  },
                },
              ],
            },
          },
        ],
      };
    });

    (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
      return {
        id: "some-event-id",
      };
    });

    getImageURL.mockImplementationOnce(
      () => "already-organization-logo-image-url"
    );

    (prismaClient.organization.findMany as jest.Mock).mockImplementationOnce(
      () => {
        return [
          {
            id: "own-organization-id",
            logo: "own-organization-logo-path",
            name: "own-organization-name",
            slug: "own-organization-slug",
            types: [
              {
                organizationType: {
                  title: "own-organization-type-title",
                },
              },
            ],
          },
        ];
      }
    );

    getImageURL.mockImplementationOnce(() => "own-organization-logo-image-url");

    (prismaClient.organization.findMany as jest.Mock).mockImplementationOnce(
      () => {
        return [
          {
            id: "suggested-organization-id",
            logo: "suggested-organization-logo-path",
            name: "suggested-organization-name",
            types: [
              {
                organizationType: {
                  title: "suggested-organization-type-title",
                },
              },
            ],
          },
        ];
      }
    );

    getImageURL.mockImplementationOnce(
      () => "suggested-organization-logo-image-url"
    );

    const response = await loader({
      request: new Request(`${testURL}?autocomplete_query=suggested`),
      context: {},
      params: { slug },
    });

    const responseBody = await response.json();

    expect(responseBody.published).toBe(true);
    expect(responseBody.responsibleOrganizations).toStrictEqual([
      {
        id: "already-organization-id",
        slug: "already-organization-slug",
        logo: "already-organization-logo-image-url",
        name: "already-organization-name",
        types: [
          {
            organizationType: {
              title: "already-organization-type-title",
            },
          },
        ],
      },
    ]);
    expect(responseBody.ownOrganizationsSuggestions).toStrictEqual([
      {
        id: "own-organization-id",
        logo: "own-organization-logo-image-url",
        name: "own-organization-name",
        slug: "own-organization-slug",
        types: [
          {
            organizationType: {
              title: "own-organization-type-title",
            },
          },
        ],
      },
    ]);
    expect(responseBody.responsibleOrganizationSuggestions).toStrictEqual([
      {
        id: "suggested-organization-id",
        logo: "suggested-organization-logo-image-url",
        name: "suggested-organization-name",
        types: [
          {
            organizationType: {
              title: "suggested-organization-type-title",
            },
          },
        ],
      },
    ]);
  });
});
