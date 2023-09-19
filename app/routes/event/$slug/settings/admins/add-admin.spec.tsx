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
      event: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
      adminOfEvent: {
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

describe("/event/$slug/settings/admins/add-admin", () => {
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

  test("profile not found", async () => {
    const request = createRequestWithFormData({
      profileId: "some-user-id",
    });

    expect.assertions(4);

    getSessionUserOrThrow.mockResolvedValueOnce({ id: "some-user-id" } as User);

    (prismaClient.event.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-event-id",
    });

    (prismaClient.profile.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const response = await action({
      request,
      context: {},
      params: { slug: "some-event-slug" },
    });
    const responseBody = await response.json();
    expect(responseBody.success).toBe(false);
    expect(responseBody.errors).toBeDefined();
    expect(responseBody.errors).not.toBeNull();
    expect(responseBody.errors.profileId).toStrictEqual([
      "Es existiert noch kein Profil unter diesem Namen.",
    ]);
  });

  test("already admin", async () => {
    expect.assertions(2);

    const request = createRequestWithFormData({
      profileId: "some-user-id",
    });

    getSessionUserOrThrow.mockResolvedValueOnce({ id: "some-user-id" } as User);

    (prismaClient.event.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-event-id",
    });

    (prismaClient.profile.findUnique as jest.Mock).mockResolvedValueOnce({
      id: "some-user-id",
      firstName: "some-user-first-name",
      lastName: "some-user-last-name",
      administeredEvents: [
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
    expect(responseBody.errors.profileId).toContain(
      "Das Profil unter diesem Namen ist bereits Administrator:in Eurer Veranstaltung."
    );
  });

  test("event not found", async () => {
    expect.assertions(1);

    const request = createRequestWithFormData({
      profileId: "some-user-id",
    });

    getSessionUserOrThrow.mockResolvedValueOnce({ id: "some-user-id" } as User);

    (prismaClient.event.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-event-id",
    });

    (prismaClient.profile.findUnique as jest.Mock).mockResolvedValueOnce({
      id: "some-user-id",
      firstName: "some-user-first-name",
      lastName: "some-user-last-name",
      administeredEvents: [],
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

  test("add event admin", async () => {
    expect.assertions(2);

    const request = createRequestWithFormData({
      profileId: "another-user-id",
    });

    getSessionUserOrThrow.mockResolvedValueOnce({ id: "some-user-id" } as User);

    (prismaClient.event.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "some-event-id",
    });

    (prismaClient.profile.findUnique as jest.Mock).mockResolvedValueOnce({
      id: "another-profile-id",
      firstName: "another-user-firstname",
      lastName: "another-user-lastname",
      administeredEvents: [
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
    expect(prismaClient.adminOfEvent.create).toHaveBeenLastCalledWith({
      data: {
        eventId: "some-event-id",
        profileId: "another-user-id",
      },
    });
    expect(responseBody.message).toBe(
      '"another-user-firstname another-user-lastname" wurde als Administrator:in hinzugefügt.'
    );
  });
});
