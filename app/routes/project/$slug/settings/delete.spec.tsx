import type { User } from "@supabase/supabase-js";
import { redirect } from "@remix-run/node";
import * as authServerModule from "~/auth.server";
import { createRequestWithFormData, testURL } from "~/lib/utils/tests";
import { prismaClient } from "~/prisma";
import { action, loader } from "./delete";

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
        delete: jest.fn(),
      },
      teamMemberOfProject: {
        findFirst: jest.fn(),
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

const slug = "slug-test";

describe("/event/$slug/settings/delete", () => {
  describe("loader", () => {
    test("no params", async () => {
      expect.assertions(2);

      const request = new Request(testURL);
      try {
        await loader({ request, context: {}, params: {} });
      } catch (error) {
        const response = error as Response;
        expect(response.status).toBe(400);

        const json = await response.json();
        expect(json.message).toBe('"slug" missing');
      }
    });

    test("anon user", async () => {
      expect.assertions(2);

      try {
        await loader({
          request: new Request(testURL),
          context: {},
          params: { slug },
        });
      } catch (error) {
        const response = error as Response;
        expect(response.status).toBe(401);

        const json = await response.json();
        expect(json.message).toBe("No session or session user found");
      }
    });

    test("project not found", async () => {
      expect.assertions(2);

      (prismaClient.project.findFirst as jest.Mock).mockResolvedValueOnce(null);

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

      const request = new Request(testURL);
      try {
        await loader({ request, context: {}, params: { slug } });
      } catch (error) {
        const response = error as Response;
        expect(response.status).toBe(404);

        const json = await response.json();
        expect(json.message).toBe("Project not found");
      }
    });

    test("not privileged user", async () => {
      expect.assertions(2);

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

      (prismaClient.project.findFirst as jest.Mock).mockImplementationOnce(
        () => {
          return { slug };
        }
      );
      (
        prismaClient.teamMemberOfProject.findFirst as jest.Mock
      ).mockImplementationOnce(() => {
        return null;
      });

      try {
        await loader({
          request: new Request(testURL),
          context: {},
          params: { slug },
        });
      } catch (error) {
        const response = error as Response;
        expect(response.status).toBe(401);

        const json = await response.json();
        expect(json.message).toBe("Not privileged");
      }
    });

    test("privileged user", async () => {
      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

      (prismaClient.project.findFirst as jest.Mock).mockImplementationOnce(
        () => {
          return {
            id: "some-project-id",
            slug,
          };
        }
      );
      (
        prismaClient.teamMemberOfProject.findFirst as jest.Mock
      ).mockImplementationOnce(() => {
        return { isPrivileged: true };
      });

      const response = await loader({
        request: new Request(testURL),
        context: {},
        params: { slug },
      });
      const responseBody = await response.json();
      expect(responseBody.userId).toBe("some-user-id");
      expect(responseBody.projectId).toBe("some-project-id");
    });
  });

  describe("action", () => {
    test("no params", async () => {
      const request = createRequestWithFormData({});

      expect.assertions(2);

      try {
        await action({ request, context: {}, params: {} });
      } catch (error) {
        const response = error as Response;
        expect(response.status).toBe(400);

        const json = await response.json();
        expect(json.message).toBe('"slug" missing');
      }
    });

    test("project not found", async () => {
      const request = createRequestWithFormData({ userId: "some-user-id" });

      expect.assertions(2);

      (prismaClient.project.findFirst as jest.Mock).mockResolvedValueOnce(null);

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

      try {
        await action({ request, context: {}, params: { slug } });
      } catch (error) {
        const response = error as Response;
        expect(response.status).toBe(404);

        const json = await response.json();
        expect(json.message).toBe("Project not found");
      }
    });

    test("anon user", async () => {
      const request = createRequestWithFormData({});

      expect.assertions(2);

      try {
        await action({
          request,
          context: {},
          params: { slug },
        });
      } catch (error) {
        const response = error as Response;
        expect(response.status).toBe(401);

        const json = await response.json();
        expect(json.message).toBe("No session or session user found");
      }
    });

    test("not privileged user", async () => {
      const request = createRequestWithFormData({ userId: "some-user-id" });

      expect.assertions(2);

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

      (prismaClient.project.findFirst as jest.Mock).mockImplementationOnce(
        () => {
          return { slug };
        }
      );
      (
        prismaClient.teamMemberOfProject.findFirst as jest.Mock
      ).mockImplementationOnce(() => {
        return null;
      });

      try {
        await action({
          request,
          context: {},
          params: { slug },
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

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "another-user-id",
      } as User);

      try {
        await action({
          request,
          context: {},
          params: { slug },
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
        projectName: "Some project name",
      });

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);
      (prismaClient.project.findFirst as jest.Mock).mockImplementationOnce(
        () => {
          return {
            id: "another-project-id",
            name: "Some other project name",
            slug,
          };
        }
      );
      (
        prismaClient.teamMemberOfProject.findFirst as jest.Mock
      ).mockImplementationOnce(() => {
        return { isPrivileged: true };
      });

      try {
        await action({
          request,
          context: {},
          params: { slug },
        });
      } catch (error) {
        const response = error as Response;
        expect(response.status).toBe(400);

        const json = await response.json();
        expect(json.message).toBe("Id nicht korrekt");
      }
    });

    test("different project name", async () => {
      const request = createRequestWithFormData({
        userId: "some-user-id",
        projectId: "some-project-id",
        projectName: "Some project name",
      });

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);
      (prismaClient.project.findFirst as jest.Mock).mockImplementationOnce(
        () => {
          return {
            id: "some-project-id",
            name: "Some other project name",
            slug,
          };
        }
      );
      (
        prismaClient.teamMemberOfProject.findFirst as jest.Mock
      ).mockImplementationOnce(() => {
        return { isPrivileged: true };
      });

      const response = await action({
        request,
        context: {},
        params: { slug },
      });

      const responseBody = await response.json();

      expect(responseBody.errors.projectName).toBeDefined();
      expect(responseBody.errors.projectName[0]).toBe(
        "Der Name des Projekts ist nicht korrekt"
      );
    });

    test("delete", async () => {
      const request = createRequestWithFormData({
        userId: "some-user-id",
        projectId: "some-project-id",
        projectName: "Some project name",
      });

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
        user_metadata: { username: "someuser" },
      } as unknown as User);
      (prismaClient.project.findFirst as jest.Mock).mockImplementationOnce(
        () => {
          return { id: "some-project-id", name: "Some project name", slug };
        }
      );
      (
        prismaClient.teamMemberOfProject.findFirst as jest.Mock
      ).mockImplementationOnce(() => {
        return { isPrivileged: true };
      });

      (prismaClient.profile.findUnique as jest.Mock).mockImplementationOnce(
        () => {
          return { username: "someuser" };
        }
      );

      const response = await action({
        request,
        context: {},
        params: { slug },
      });

      expect(response).toEqual(redirect("/profile/someuser"));
    });
  });
});
