import type { User } from "@supabase/supabase-js";
import * as authServerModule from "~/auth.server";
import { createRequestWithFormData } from "~/lib/utils/tests";
import { prismaClient } from "~/prisma.server";
import { action } from "./add-member";

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
      },
      teamMemberOfProject: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      profile: {
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

describe("/project/$slug/settings/team/add-member", () => {
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
    const request = createRequestWithFormData({
      userId: "some-user-id",
      projectId: "some-project-id",
      id: "another-user-id",
    });

    expect.assertions(2);

    (prismaClient.project.findFirst as jest.Mock).mockResolvedValue(null);

    getSessionUserOrThrow.mockResolvedValue({ id: "some-user-id" } as User);

    (prismaClient.profile.findFirst as jest.Mock).mockImplementationOnce(() => {
      return { teamMemberOfProjects: [] };
    });

    try {
      await action({ request, context: {}, params: {} });
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(404);

      const json = await response.json();
      expect(json.message).toBe("Project not found");
    }
  });

  test("authenticated user", async () => {
    const request = createRequestWithFormData({
      userId: "some-user-id",
      projectId: "some-project-id",
      id: "another-user-id",
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
    (prismaClient.profile.findFirst as jest.Mock).mockImplementationOnce(() => {
      return { teamMemberOfProjects: [] };
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

  test("not privileged user", async () => {
    const request = createRequestWithFormData({
      userId: "some-user-id",
      projectId: "some-project-id",
      id: "another-user-id",
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
    (prismaClient.profile.findFirst as jest.Mock).mockImplementationOnce(() => {
      return { teamMemberOfProjects: [] };
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
      id: "another-user-id",
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
    (prismaClient.profile.findFirst as jest.Mock).mockImplementationOnce(() => {
      return { teamMemberOfProjects: [] };
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
      expect(json.message).toBe("Project IDs differ");
    }
  });

  test("already member", async () => {
    expect.assertions(2);

    const request = createRequestWithFormData({
      userId: "some-user-id",
      projectId: "some-project-id",
      id: "another-user-id",
    });

    getSessionUserOrThrow.mockResolvedValue({ id: "some-user-id" } as User);
    (prismaClient.project.findFirst as jest.Mock).mockImplementationOnce(() => {
      return { id: "some-project-id" };
    });
    (prismaClient.profile.findFirst as jest.Mock).mockImplementationOnce(() => {
      return {
        teamMemberOfProjects: [
          {
            project: {
              id: "some-project-id",
            },
          },
        ],
      };
    });
    (
      prismaClient.teamMemberOfProject.findFirst as jest.Mock
    ).mockImplementationOnce(() => {
      return { isPrivileged: true };
    });

    const response = await action({
      request,
      context: {},
      params: {},
    });
    const responseBody = await response.json();

    expect(responseBody.success).toBe(false);
    expect(responseBody.errors.id).toContain(
      "Das Profil unter diesem Namen ist bereits Mitglied Eures Projektes."
    );
  });

  test("add project team member", async () => {
    expect.assertions(2);

    const request = createRequestWithFormData({
      userId: "some-user-id",
      projectId: "some-project-id",
      id: "another-user-id",
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
    (prismaClient.profile.findFirst as jest.Mock).mockImplementationOnce(() => {
      return {
        teamMemberOfProjects: [],
        firstName: "some-firstname",
        lastName: "some-lastname",
      };
    });
    (prismaClient.profile.findFirst as jest.Mock).mockImplementationOnce(() => {
      return {
        id: "another-user-id",
      };
    });

    const response = await action({
      request,
      context: {},
      params: {},
    });

    const responseBody = await response.json();
    expect(prismaClient.teamMemberOfProject.create).toHaveBeenLastCalledWith({
      data: {
        projectId: "some-project-id",
        profileId: "another-user-id",
      },
    });
    expect(responseBody.message).toBe(
      'Ein neues Teammitglied mit dem Namen "some-firstname some-lastname" wurde hinzugefügt.'
    );
  });
});
