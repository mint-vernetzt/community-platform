import type { User } from "@supabase/supabase-js";
import * as authServerModule from "~/auth.server";
import { createRequestWithFormData } from "~/lib/utils/tests";
import { prismaClient } from "~/prisma";
import { action } from "./remove-organization";

// @ts-ignore
const expect = global.expect as jest.Expect;

const getUserByRequest = jest.spyOn(authServerModule, "getUserByRequest");

jest.mock("~/prisma", () => {
  return {
    prismaClient: {
      project: {
        findFirst: jest.fn(),
      },
      responsibleOrganizationOfProject: {
        delete: jest.fn(),
      },
      teamMemberOfProject: {
        findFirst: jest.fn(),
      },
      profile: {
        findFirst: jest.fn(),
      },
    },
  };
});

describe("/project/$slug/settings/team/add-member", () => {
  beforeAll(() => {
    process.env.FEATURES = "projects";
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

  test("project not found", async () => {
    const request = createRequestWithFormData({
      userId: "some-user-id",
    });

    expect.assertions(2);

    (prismaClient.project.findFirst as jest.Mock).mockResolvedValue(null);

    getUserByRequest.mockResolvedValue({ id: "some-user-id" } as User);

    try {
      await action({ request, context: {}, params: {} });
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(404);

      const json = await response.json();
      expect(json.message).toBe("Project not found");
    }
  });

  test("not privileged user", async () => {
    const request = createRequestWithFormData({
      userId: "some-user-id",
    });

    expect.assertions(2);

    getUserByRequest.mockResolvedValue({ id: "some-user-id" } as User);

    (prismaClient.project.findFirst as jest.Mock).mockImplementationOnce(() => {
      return {};
    });
    (
      prismaClient.teamMemberOfProject.findFirst as jest.Mock
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

  test("different project id", async () => {
    expect.assertions(2);

    const request = createRequestWithFormData({
      userId: "some-user-id",
      projectId: "some-project-id",
    });

    getUserByRequest.mockResolvedValue({ id: "some-user-id" } as User);
    (prismaClient.project.findFirst as jest.Mock).mockImplementationOnce(() => {
      return { id: "another-project-id" };
    });
    (
      prismaClient.teamMemberOfProject.findFirst as jest.Mock
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
      expect(json.message).toBe("Project IDs differ");
    }
  });

  test("remove responsible organization from project", async () => {
    expect.assertions(2);

    const request = createRequestWithFormData({
      userId: "some-user-id",
      projectId: "some-project-id",
      organizationId: "some-organization-id",
    });

    getUserByRequest.mockResolvedValue({ id: "some-user-id" } as User);
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

    try {
      const result = await action({
        request,
        context: {},
        params: {},
      });
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
      expect(result.success).toBe(true);
    } catch (error) {
      const response = error as Response;
      console.log(response);

      const json = await response.json();
      console.log(json);
    }
  });

  afterAll(() => {
    delete process.env.FEATURES;
  });
});
