import type { User } from "@supabase/supabase-js";
import * as authServerModule from "~/auth.server";
import { createRequestWithFormData } from "~/lib/utils/tests";
import { prismaClient } from "~/prisma.server";
import { action } from "./remove-organization";

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
        delete: jest.fn(),
      },
    },
  };
});

jest.mock("~/lib/utils/application", () => {
  return {
    checkFeatureAbilitiesOrThrow: jest.fn(),
  };
});

describe("/project/$slug/settings/team/add-member", () => {
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

  test("project not found", async () => {
    const request = createRequestWithFormData({
      organizationId: "some-organization-id",
    });

    expect.assertions(1);

    getSessionUserOrThrow.mockResolvedValueOnce({ id: "some-user-id" } as User);

    (prismaClient.project.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-project-id",
    });

    (prismaClient.project.findUnique as jest.Mock).mockResolvedValueOnce(null);

    try {
      await action({
        request,
        context: {},
        params: { slug: "some-project-slug" },
      });
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(404);
    }
  });

  test("remove project organization", async () => {
    expect.assertions(2);

    const request = createRequestWithFormData({
      organizationId: "some-organization-id",
    });

    getSessionUserOrThrow.mockResolvedValueOnce({ id: "some-user-id" } as User);

    (prismaClient.project.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-project-id",
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
      prismaClient.responsibleOrganizationOfProject.delete
    ).toHaveBeenLastCalledWith({
      where: {
        projectId_organizationId: {
          projectId: "some-project-id",
          organizationId: "some-organization-id",
        },
      },
    });
    expect(responseBody.success).toBe(true);
  });
});
