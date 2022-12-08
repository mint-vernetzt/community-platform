import type { User } from "@supabase/supabase-js";
import * as authServerModule from "~/auth.server";
import { createRequestWithFormData } from "~/lib/utils/tests";
import { prismaClient } from "~/prisma";
import { action } from "./add-organization";

// @ts-ignore
const expect = global.expect as jest.Expect;

const getSessionUserOrThrow = jest.spyOn(
  authServerModule,
  "getSessionUserOrThrow"
);

jest.mock("~/prisma", () => {
  return {
    prismaClient: {
      project: {
        findFirst: jest.fn(),
      },
      teamMemberOfProject: {
        findFirst: jest.fn(),
      },
      responsibleOrganizationOfProject: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      organization: {
        findFirst: jest.fn(),
      },
    },
  };
});

describe("/project/$slug/settings/organization/add-organization", () => {
  beforeAll(() => {
    process.env.FEATURES = "projects";
  });

  test("anon user", async () => {
    const request = createRequestWithFormData({});

    expect.assertions(2);

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

  test("project not found", async () => {
    const request = await createRequestWithFormData({
      userId: "some-user-id",
      projectId: "some-project-id",
      email: "anotheruser@mail.com",
    });

    expect.assertions(2);

    (prismaClient.project.findFirst as jest.Mock).mockResolvedValue(null);

    getSessionUserOrThrow.mockResolvedValue({ id: "some-user-id" } as User);

    (prismaClient.organization.findFirst as jest.Mock).mockImplementationOnce(
      () => {
        return { responsibleForProject: [] };
      }
    );

    try {
      await action({ request, context: {}, params: {} });
    } catch (error) {
      const response = error as Response;
      console.log(response);
      expect(response.status).toBe(404);

      const json = await response.json();
      expect(json.message).toBe("Project not found");
    }
  });

  test("not privileged user", async () => {
    const request = createRequestWithFormData({
      userId: "some-user-id",
      projectId: "some-project-id",
      email: "anotheruser@mail.com",
    });

    expect.assertions(2);

    getSessionUserOrThrow.mockResolvedValue({ id: "some-user-id" } as User);

    (prismaClient.project.findFirst as jest.Mock).mockImplementationOnce(() => {
      return {};
    });
    (
      prismaClient.teamMemberOfProject.findFirst as jest.Mock
    ).mockImplementationOnce(() => {
      return null;
    });
    (prismaClient.organization.findFirst as jest.Mock).mockImplementationOnce(
      () => {
        return { responsibleForProject: [] };
      }
    );

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

    getSessionUserOrThrow.mockResolvedValue({ id: "another-user-id" } as User);

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

  test("different project id", async () => {
    expect.assertions(2);

    const request = createRequestWithFormData({
      userId: "some-user-id",
      projectId: "some-project-id",
      email: "anotheruser@mail.com",
    });

    getSessionUserOrThrow.mockResolvedValue({ id: "some-user-id" } as User);
    (prismaClient.project.findFirst as jest.Mock).mockImplementationOnce(() => {
      return { id: "another-project-id" };
    });
    (
      prismaClient.teamMemberOfProject.findFirst as jest.Mock
    ).mockImplementationOnce(() => {
      return { isPrivileged: true };
    });
    (prismaClient.organization.findFirst as jest.Mock).mockImplementationOnce(
      () => {
        return { responsibleForProject: [] };
      }
    );

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
      expect(json.message).toBe("Project IDs differ");
    }
  });

  test("already responsible organization", async () => {
    expect.assertions(2);

    const request = createRequestWithFormData({
      userId: "some-user-id",
      projectId: "some-project-id",
      email: "anotheruser@mail.com",
    });

    getSessionUserOrThrow.mockResolvedValue({ id: "some-user-id" } as User);
    (prismaClient.project.findFirst as jest.Mock).mockImplementationOnce(() => {
      return {
        id: "some-project-id",
      };
    });
    (
      prismaClient.teamMemberOfProject.findFirst as jest.Mock
    ).mockImplementationOnce(() => {
      return { isPrivileged: true };
    });

    (prismaClient.organization.findFirst as jest.Mock).mockImplementationOnce(
      () => {
        return {
          responsibleForProject: [
            {
              project: {
                id: "some-project-id",
              },
            },
          ],
        };
      }
    );

    const response = await action({
      request,
      context: {},
      params: {},
    });
    const responseBody = await response.json();

    expect(responseBody.success).toBe(false);
    expect(responseBody.errors.organizationName).toContain(
      "Die Organisation mit diesem Namen ist bereits für Euer Projekt verantwortlich."
    );
  });

  test("add responsible organization to project", async () => {
    expect.assertions(2);

    const request = createRequestWithFormData({
      userId: "some-user-id",
      projectId: "some-project-id",
      organizationName: "Some Organization",
    });

    getSessionUserOrThrow.mockResolvedValue({ id: "some-user-id" } as User);
    (prismaClient.project.findFirst as jest.Mock).mockImplementationOnce(() => {
      return {
        id: "some-project-id",
      };
    });
    (
      prismaClient.teamMemberOfProject.findFirst as jest.Mock
    ).mockImplementationOnce(() => {
      return { isPrivileged: true };
    });

    (prismaClient.organization.findFirst as jest.Mock).mockImplementationOnce(
      () => {
        return { responsibleForProject: [] };
      }
    );
    (prismaClient.organization.findFirst as jest.Mock).mockImplementationOnce(
      () => {
        return {
          id: "some-organization-id",
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
        prismaClient.responsibleOrganizationOfProject.create
      ).toHaveBeenLastCalledWith({
        data: {
          projectId: "some-project-id",
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
