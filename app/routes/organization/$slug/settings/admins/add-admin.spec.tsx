import type { User } from "@supabase/supabase-js";
import * as authServerModule from "~/auth.server";
import { createRequestWithFormData } from "~/lib/utils/tests";
import { prismaClient } from "~/prisma.server";
import { action } from "./add-admin";

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
        create: jest.fn(),
      },
      profile: {
        findUnique: jest.fn(),
      },
    },
  };
});

jest.mock("~/lib/utils/application", () => {
  return {
    checkFeatureAbilitiesOrThrow: jest.fn(),
  };
});

describe("/organization/$slug/settings/admins/add-admin", () => {
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

  test("profile not found", async () => {
    const request = createRequestWithFormData({
      profileId: "some-user-id",
    });

    expect.assertions(4);

    getSessionUserOrThrow.mockResolvedValueOnce({ id: "some-user-id" } as User);

    (prismaClient.organization.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-organization-id",
    });

    (prismaClient.profile.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const response = await action({
      request,
      context: {},
      params: { slug: "some-organization-slug" },
    });
    const responseBody = await response.json();
    // TODO: fix type issues
    // @ts-ignore
    expect(responseBody.success).toBe(false);
    // @ts-ignore
    expect(responseBody.errors).toBeDefined();
    // @ts-ignore
    expect(responseBody.errors).not.toBeNull();
    // @ts-ignore
    expect(responseBody.errors.profileId).toStrictEqual([
      "error.inputError.doesNotExist",
    ]);
  });

  test("already admin", async () => {
    expect.assertions(2);

    const request = createRequestWithFormData({
      profileId: "some-user-id",
    });

    getSessionUserOrThrow.mockResolvedValueOnce({ id: "some-user-id" } as User);

    (prismaClient.organization.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-organization-id",
    });

    (prismaClient.profile.findUnique as jest.Mock).mockResolvedValueOnce({
      id: "some-user-id",
      firstName: "some-user-first-name",
      lastName: "some-user-last-name",
      administeredOrganizations: [
        {
          organization: {
            slug: "some-organization-slug",
          },
        },
      ],
    });

    const response = await action({
      request,
      context: {},
      params: { slug: "some-organization-slug" },
    });
    const responseBody = await response.json();

    // TODO: fix type issues
    // @ts-ignore
    expect(responseBody.success).toBe(false);
    // TODO: fix type issues
    // @ts-ignore
    expect(responseBody.errors.profileId).toStrictEqual([
      "error.inputError.alreadyAdmin",
    ]);
  });

  test("organization not found", async () => {
    expect.assertions(1);

    const request = createRequestWithFormData({
      profileId: "some-user-id",
    });

    getSessionUserOrThrow.mockResolvedValueOnce({ id: "some-user-id" } as User);

    (prismaClient.organization.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-organization-id",
    });

    (prismaClient.profile.findUnique as jest.Mock).mockResolvedValueOnce({
      id: "some-user-id",
      firstName: "some-user-first-name",
      lastName: "some-user-last-name",
      administeredOrganizations: [],
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

  test("add organization admin", async () => {
    expect.assertions(2);

    const request = createRequestWithFormData({
      profileId: "another-user-id",
    });

    getSessionUserOrThrow.mockResolvedValueOnce({ id: "some-user-id" } as User);

    (prismaClient.organization.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-organization-id",
    });

    (prismaClient.profile.findUnique as jest.Mock).mockResolvedValueOnce({
      id: "another-profile-id",
      firstName: "another-user-firstname",
      lastName: "another-user-lastname",
      administeredOrganizations: [
        {
          organization: {
            slug: "another-organization-slug",
          },
        },
      ],
    });

    (prismaClient.organization.findUnique as jest.Mock).mockResolvedValueOnce({
      id: "some-organization-id",
    });

    const response = await action({
      request,
      context: {},
      params: { slug: "some-organization-slug" },
    });
    const responseBody = await response.json();
    expect(prismaClient.adminOfOrganization.create).toHaveBeenLastCalledWith({
      data: {
        organizationId: "some-organization-id",
        profileId: "another-user-id",
      },
    });
    // TODO: fix type issue
    // @ts-ignore
    expect(responseBody.message).toBe(
      // '"another-user-firstname another-user-lastname" wurde als Administrator:in hinzugefügt.'
      "feedback"
    );
  });
});
