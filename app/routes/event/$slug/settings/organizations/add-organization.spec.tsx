import { User } from "@supabase/supabase-js";
import * as authServerModule from "~/auth.server";
import { createRequestWithFormData } from "~/lib/utils/tests";
import { prismaClient } from "~/prisma";
import { action } from "./add-organization";

// @ts-ignore
const expect = global.expect as jest.Expect;

const getUserByRequest = jest.spyOn(authServerModule, "getUserByRequest");

jest.mock("~/prisma", () => {
  return {
    prismaClient: {
      event: {
        findFirst: jest.fn(),
      },
      teamMemberOfEvent: {
        findFirst: jest.fn(),
      },
      responsibleOrganizationOfEvent: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      organization: {
        findFirst: jest.fn(),
      },
    },
  };
});

describe("/event/$slug/settings/organization/add-organization", () => {
  beforeAll(() => {
    process.env.FEATURES = "events";
  });

  test("anon user", async () => {
    const request = createRequestWithFormData({});

    expect.assertions(2);

    getUserByRequest.mockResolvedValue(null);

    try {
      await action({
        request,
        context: {},
        params: {},
      });
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json.message).toBe("No session or session user found");
    }
  });

  test("event not found", async () => {
    const request = createRequestWithFormData({
      userId: "some-user-id",
      email: "anotheruser@mail.com",
      organizationName: "some-organization",
    });

    expect.assertions(2);

    (prismaClient.event.findFirst as jest.Mock).mockResolvedValueOnce(null);
    (prismaClient.organization.findFirst as jest.Mock).mockResolvedValueOnce({
      responsibleForEvents: [],
    });

    getUserByRequest.mockResolvedValue({ id: "some-user-id" } as User);

    try {
      await action({ request, context: {}, params: {} });
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(404);

      const json = await response.json();
      expect(json.message).toBe("Event not found");
    }
  });

  test("not privileged user", async () => {
    const request = createRequestWithFormData({
      userId: "some-user-id",
      email: "anotheruser@mail.com",
      organizationName: "some-organization",
    });

    expect.assertions(2);

    getUserByRequest.mockResolvedValue({ id: "some-user-id" } as User);

    (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
      return {};
    });
    (prismaClient.organization.findFirst as jest.Mock).mockResolvedValueOnce({
      responsibleForEvents: [],
    });
    (
      prismaClient.teamMemberOfEvent.findFirst as jest.Mock
    ).mockImplementationOnce(() => {
      return null;
    });

    try {
      await action({
        request,
        context: {},
        params: {},
      });
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json.message).toBe("Not privileged");
    }
  });

  test("different user id", async () => {
    const request = createRequestWithFormData({ userId: "some-user-id" });

    expect.assertions(2);

    getUserByRequest.mockResolvedValue({ id: "another-user-id" } as User);

    try {
      await action({
        request,
        context: {},
        params: {},
      });
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json.message).toBe("Identity check failed");
    }
  });

  test("different event id", async () => {
    expect.assertions(2);

    const request = createRequestWithFormData({
      userId: "some-user-id",
      eventId: "some-event-id",
      email: "anotheruser@mail.com",
      organizationName: "some-organization",
    });

    getUserByRequest.mockResolvedValue({ id: "some-user-id" } as User);
    (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
      return { id: "another-event-id" };
    });
    (prismaClient.organization.findFirst as jest.Mock).mockResolvedValueOnce({
      responsibleForEvents: [],
    });
    (
      prismaClient.teamMemberOfEvent.findFirst as jest.Mock
    ).mockImplementationOnce(() => {
      return { isPrivileged: true };
    });

    try {
      await action({
        request,
        context: {},
        params: {},
      });
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.message).toBe("Event IDs differ");
    }
  });

  test("already member", async () => {
    expect.assertions(2);

    const request = createRequestWithFormData({
      userId: "some-user-id",
      eventId: "some-event-id",
      email: "anotheruser@mail.com",
      organizationName: "some-organization",
    });

    getUserByRequest.mockResolvedValue({ id: "some-user-id" } as User);
    (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
      return { id: "some-event-id" };
    });
    (prismaClient.organization.findFirst as jest.Mock).mockResolvedValueOnce({
      responsibleForEvents: [
        {
          event: {
            id: "some-event-id",
          },
        },
      ],
    });
    (
      prismaClient.teamMemberOfEvent.findFirst as jest.Mock
    ).mockImplementationOnce(() => {
      return { isPrivileged: true };
    });

    try {
      const response = await action({
        request,
        context: {},
        params: {},
      });

      expect(response.success).toBe(false);
      expect(response.errors.organizationName).toContain(
        "Die Organisation mit diesem Namen ist bereits für Eure Veranstaltung verantwortlich."
      );
    } catch (error) {}
  });

  test("add responsible organization to event", async () => {
    expect.assertions(2);

    const request = createRequestWithFormData({
      userId: "some-user-id",
      eventId: "some-event-id",
      organizationName: "Some Organization",
    });

    getUserByRequest.mockResolvedValue({ id: "some-user-id" } as User);
    (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
      return {
        id: "some-event-id",
      };
    });
    (
      prismaClient.teamMemberOfEvent.findFirst as jest.Mock
    ).mockImplementationOnce(() => {
      return { isPrivileged: true };
    });

    (prismaClient.organization.findFirst as jest.Mock).mockImplementation(
      () => {
        return {
          id: "some-organization-id",
          responsibleForEvents: [],
        };
      }
    );

    try {
      const result = await action({
        request,
        context: {},
        params: {},
      });
      expect(
        prismaClient.responsibleOrganizationOfEvent.create
      ).toHaveBeenLastCalledWith({
        data: {
          eventId: "some-event-id",
          organizationId: "some-organization-id",
        },
      });
      expect(result.success).toBe(true);
    } catch (error) {}
  });

  afterAll(() => {
    delete process.env.FEATURES;
  });
});
