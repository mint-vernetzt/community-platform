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
      organization: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
      adminOfOrganization: {
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

describe("/organization/$slug/settings/admins/remove-admin", () => {
  test("anon user", async () => {
    const request = createRequestWithFormData({});

    expect.assertions(2);

    try {
      await action({
        request,
        context: {},
        params: { slug: "some-organization-slug" },
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

    (prismaClient.organization.findFirst as jest.Mock).mockResolvedValueOnce(
      null
    );

    try {
      await action({
        request,
        context: {},
        params: { slug: "some-organization-slug" },
      });
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(403);
    }
  });

  test("organization not found", async () => {
    const request = createRequestWithFormData({
      profileId: "some-user-id",
    });

    expect.assertions(1);

    getSessionUserOrThrow.mockResolvedValueOnce({ id: "some-user-id" } as User);

    (prismaClient.organization.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-profile-id",
    });

    (prismaClient.organization.findUnique as jest.Mock).mockResolvedValueOnce(
      null
    );

    try {
      await action({
        request,
        context: {},
        params: { slug: "some-organization-slug" },
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

    (prismaClient.organization.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-organization-id",
    });

    (prismaClient.organization.findUnique as jest.Mock).mockResolvedValueOnce({
      id: "some-organization-id",
      _count: {
        admins: 1,
      },
    });

    const response = await action({
      request,
      context: {},
      params: { slug: "some-organization-slug" },
    });
    const responseBody = await response.json();

    expect(responseBody.success).toBe(false);
    // TODO: fix type issue
    // @ts-ignore
    expect(responseBody.errors._global).toStrictEqual(["error.adminCount"]);
  });

  test("remove organization admin (self)", async () => {
    expect.assertions(2);

    const request = createRequestWithFormData({
      profileId: "some-user-id",
    });

    getSessionUserOrThrow.mockResolvedValueOnce({ id: "some-user-id" } as User);

    (prismaClient.organization.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-organization-id",
    });

    (prismaClient.organization.findUnique as jest.Mock).mockResolvedValueOnce({
      id: "some-organization-id",
      _count: {
        admins: 2,
      },
    });

    const response = await action({
      request,
      context: {},
      params: { slug: "some-organization-slug" },
    });
    expect(prismaClient.adminOfOrganization.delete).toHaveBeenLastCalledWith({
      where: {
        profileId_organizationId: {
          organizationId: "some-organization-id",
          profileId: "some-user-id",
        },
      },
    });
    expect(response).toStrictEqual(
      redirect(`/organization/some-organization-slug`)
    );
  });

  test("remove organization admin (other user)", async () => {
    expect.assertions(2);

    const request = createRequestWithFormData({
      profileId: "another-user-id",
    });

    getSessionUserOrThrow.mockResolvedValueOnce({ id: "some-user-id" } as User);

    (prismaClient.organization.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-organization-id",
    });

    (prismaClient.organization.findUnique as jest.Mock).mockResolvedValueOnce({
      id: "some-organization-id",
      _count: {
        admins: 2,
      },
    });

    const response = await action({
      request,
      context: {},
      params: { slug: "some-organization-slug" },
    });
    const responseBody = await response.json();
    expect(prismaClient.adminOfOrganization.delete).toHaveBeenLastCalledWith({
      where: {
        profileId_organizationId: {
          organizationId: "some-organization-id",
          profileId: "another-user-id",
        },
      },
    });
    expect(responseBody.success).toBe(true);
  });
});
