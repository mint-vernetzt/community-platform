import type { User } from "@supabase/supabase-js";
import * as authServerModule from "~/auth.server";
import { createRequestWithFormData } from "~/lib/utils/tests";
import { prismaClient } from "~/prisma.server";
import { action } from "./add-organization";

// @ts-ignore
const expect = global.expect as jest.Expect;

const getSessionUserOrThrow = jest.spyOn(
  authServerModule,
  "getSessionUserOrThrow"
);

jest.mock("~/prisma.server", () => {
  return {
    prismaClient: {
      project: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
      responsibleOrganizationOfProject: {
        create: jest.fn(),
      },
      organization: {
        findFirst: jest.fn(),
      },
    },
  };
});

jest.mock("~/lib/utils/application", () => {
  return {
    checkFeatureAbilitiesOrThrow: jest.fn(),
  };
});

describe("/project/$slug/settings/organization/add-organization", () => {
  test("anon user", async () => {
    const request = createRequestWithFormData({});

    expect.assertions(2);

    try {
      await action({
        request,
        context: {},
        params: { slug: "some-project-slug" },
      });
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json.message).toBe("No session or session user found");
    }
  });

  test("authenticated but not admin user", async () => {
    const request = createRequestWithFormData({});

    expect.assertions(1);

    getSessionUserOrThrow.mockResolvedValueOnce({ id: "some-user-id" } as User);

    (prismaClient.project.findFirst as jest.Mock).mockResolvedValueOnce(null);

    try {
      await action({
        request,
        context: {},
        params: { slug: "some-project-slug" },
      });
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(403);
    }
  });

  test("organization not found", async () => {
    const request = createRequestWithFormData({
      organizationId: "some-organization-id",
    });

    expect.assertions(4);

    getSessionUserOrThrow.mockResolvedValueOnce({ id: "some-user-id" } as User);

    (prismaClient.project.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-project-id",
    });

    (prismaClient.organization.findFirst as jest.Mock).mockResolvedValueOnce(
      null
    );

    const response = await action({
      request,
      context: {},
      params: { slug: "some-project-slug" },
    });
    const responseBody = await response.json();
    expect(responseBody.success).toBe(false);
    expect(responseBody.errors).toBeDefined();
    expect(responseBody.errors).not.toBeNull();
    expect(responseBody.errors.organizationId).toStrictEqual([
      "Es existiert noch keine Organisation mit diesem Namen.",
    ]);
  });

  test("already responsible", async () => {
    expect.assertions(2);

    const request = createRequestWithFormData({
      organizationId: "some-organization-id",
    });

    getSessionUserOrThrow.mockResolvedValueOnce({ id: "some-user-id" } as User);

    (prismaClient.project.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-project-id",
    });

    (prismaClient.organization.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-organization-id",
      responsibleForProject: [
        {
          project: {
            slug: "some-project-slug",
          },
        },
      ],
    });

    const response = await action({
      request,
      context: {},
      params: { slug: "some-project-slug" },
    });
    const responseBody = await response.json();

    expect(responseBody.success).toBe(false);
    expect(responseBody.errors.organizationId).toContain(
      "Die Organisation mit diesem Namen ist bereits für Euer Projekt verantwortlich."
    );
  });

  test("add responsible organization to project", async () => {
    expect.assertions(2);

    const request = createRequestWithFormData({
      organizationId: "some-organization-id",
    });

    getSessionUserOrThrow.mockResolvedValueOnce({ id: "some-user-id" } as User);

    (prismaClient.project.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-project-id",
    });

    (prismaClient.organization.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-organization-id",
      name: "some-organization-name",
      responsibleForProject: [
        {
          project: {
            slug: "another-project-slug",
          },
        },
      ],
    });

    (prismaClient.project.findUnique as jest.Mock).mockResolvedValueOnce({
      id: "some-project-id",
    });

    const response = await action({
      request,
      context: {},
      params: { slug: "some-project-slug" },
    });
    const responseBody = await response.json();
    expect(
      prismaClient.responsibleOrganizationOfProject.create
    ).toHaveBeenLastCalledWith({
      data: {
        projectId: "some-project-id",
        organizationId: "some-organization-id",
      },
    });
    expect(responseBody.message).toBe(
      'Die Organisation "some-organization-name" ist jetzt verantwortlich für Euer Projekt.'
    );
  });
});
