import type { User } from "@supabase/supabase-js";
import * as authServerModule from "~/auth.server";
import { createRequestWithFormData } from "~/lib/utils/tests";
import { prismaClient } from "~/prisma.server";
import { action } from "./remove-admin";
import { redirect } from "@remix-run/node";

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
      adminOfProject: {
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

describe("/project/$slug/settings/admins/remove-admin", () => {
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
      profileId: "some-user-id",
    });

    expect.assertions(1);

    getSessionUserOrThrow.mockResolvedValueOnce({ id: "some-user-id" } as User);

    (prismaClient.project.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-profile-id",
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

  test("last admin cannot be removed", async () => {
    expect.assertions(2);

    const request = createRequestWithFormData({
      profileId: "some-user-id",
    });

    getSessionUserOrThrow.mockResolvedValueOnce({ id: "some-user-id" } as User);

    (prismaClient.project.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-project-id",
    });

    (prismaClient.project.findUnique as jest.Mock).mockResolvedValueOnce({
      id: "some-project-id",
      _count: {
        admins: 1,
      },
    });

    const response = await action({
      request,
      context: {},
      params: { slug: "some-project-slug" },
    });
    const responseBody = await response.json();

    expect(responseBody.success).toBe(false);
    expect(responseBody.errors._global).toContain(
      "Es muss immer eine:n Administrator:in geben. Bitte füge zuerst jemand anderen als Administrator:in hinzu."
    );
  });

  test("remove project admin (self)", async () => {
    expect.assertions(2);

    const request = createRequestWithFormData({
      profileId: "some-user-id",
    });

    getSessionUserOrThrow.mockResolvedValueOnce({ id: "some-user-id" } as User);

    (prismaClient.project.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-project-id",
    });

    (prismaClient.project.findUnique as jest.Mock).mockResolvedValueOnce({
      id: "some-project-id",
      _count: {
        admins: 2,
      },
    });

    const response = await action({
      request,
      context: {},
      params: { slug: "some-project-slug" },
    });
    expect(prismaClient.adminOfProject.delete).toHaveBeenLastCalledWith({
      where: {
        profileId_projectId: {
          projectId: "some-project-id",
          profileId: "some-user-id",
        },
      },
    });
    expect(response).toStrictEqual(redirect(`/project/some-project-slug`));
  });

  test("remove project admin (other user)", async () => {
    expect.assertions(2);

    const request = createRequestWithFormData({
      profileId: "another-user-id",
    });

    getSessionUserOrThrow.mockResolvedValueOnce({ id: "some-user-id" } as User);

    (prismaClient.project.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-project-id",
    });

    (prismaClient.project.findUnique as jest.Mock).mockResolvedValueOnce({
      id: "some-project-id",
      _count: {
        admins: 2,
      },
    });

    const response = await action({
      request,
      context: {},
      params: { slug: "some-project-slug" },
    });
    const responseBody = await response.json();
    expect(prismaClient.adminOfProject.delete).toHaveBeenLastCalledWith({
      where: {
        profileId_projectId: {
          projectId: "some-project-id",
          profileId: "another-user-id",
        },
      },
    });
    expect(responseBody.success).toBe(true);
  });
});
