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
      event: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
      responsibleOrganizationOfEvent: {
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

describe("/event/$slug/settings/organization/add-organization", () => {
  test("anon user", async () => {
    const request = createRequestWithFormData({});

    expect.assertions(2);

    try {
      await action({
        request,
        context: {},
        params: { slug: "some-event-slug" },
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

    (prismaClient.event.findFirst as jest.Mock).mockResolvedValueOnce(null);

    try {
      await action({
        request,
        context: {},
        params: { slug: "some-event-slug" },
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

    (prismaClient.event.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-event-id",
    });

    (prismaClient.organization.findFirst as jest.Mock).mockResolvedValueOnce(
      null
    );

    const response = await action({
      request,
      context: {},
      params: { slug: "some-event-slug" },
    });
    const responseBody = await response.json();
    expect(responseBody.success).toBe(false);
    expect(responseBody.errors).toBeDefined();
    expect(responseBody.errors).not.toBeNull();
    expect(responseBody.errors.organizationId).toStrictEqual([
      "error.notFound",
    ]);
  });

  test("already responsible", async () => {
    expect.assertions(2);

    const request = createRequestWithFormData({
      organizationId: "some-organization-id",
    });

    getSessionUserOrThrow.mockResolvedValueOnce({ id: "some-user-id" } as User);

    (prismaClient.event.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-event-id",
    });

    (prismaClient.organization.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-organization-id",
      responsibleForEvents: [
        {
          event: {
            slug: "some-event-slug",
          },
        },
      ],
    });

    const response = await action({
      request,
      context: {},
      params: { slug: "some-event-slug" },
    });
    const responseBody = await response.json();

    expect(responseBody.success).toBe(false);
    expect(responseBody.errors.organizationId).toStrictEqual([
      "error.inputError",
    ]);
  });

  test("event not found", async () => {
    expect.assertions(1);

    const request = createRequestWithFormData({
      organizationId: "some-organization-id",
    });

    getSessionUserOrThrow.mockResolvedValueOnce({ id: "some-user-id" } as User);

    (prismaClient.event.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-event-id",
    });

    (prismaClient.organization.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-organization-id",
      name: "some-organization-name",
      responsibleForEvents: [
        {
          event: {
            slug: "another-event-slug",
          },
        },
      ],
    });

    (prismaClient.event.findUnique as jest.Mock).mockResolvedValueOnce(null);

    try {
      await action({
        request,
        context: {},
        params: { slug: "some-event-slug" },
      });
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(404);
    }
  });

  test("add responsible organization to event", async () => {
    expect.assertions(2);

    const request = createRequestWithFormData({
      organizationId: "some-organization-id",
    });

    getSessionUserOrThrow.mockResolvedValueOnce({ id: "some-user-id" } as User);

    (prismaClient.event.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-event-id",
    });

    (prismaClient.organization.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-organization-id",
      name: "some-organization-name",
      responsibleForEvents: [
        {
          event: {
            slug: "another-event-slug",
          },
        },
      ],
    });

    (prismaClient.event.findUnique as jest.Mock).mockResolvedValueOnce({
      id: "some-event-id",
    });

    const response = await action({
      request,
      context: {},
      params: { slug: "some-event-slug" },
    });
    const responseBody = await response.json();
    expect(
      prismaClient.responsibleOrganizationOfEvent.create
    ).toHaveBeenLastCalledWith({
      data: {
        eventId: "some-event-id",
        organizationId: "some-organization-id",
      },
    });
    expect(responseBody.message).toBe("feedback");
  });
});
