import type { User } from "@supabase/supabase-js";
import { redirect } from "@remix-run/node";
import * as authServerModule from "~/auth.server";
import { createRequestWithFormData, testURL } from "~/lib/utils/tests";
import { prismaClient } from "~/prisma.server";
import { action, loader } from "./delete";

// @ts-ignore
const expect = global.expect as jest.Expect;

const getSessionUserOrThrow = jest.spyOn(
  authServerModule,
  "getSessionUserOrThrow"
);

jest.mock("~/lib/utils/application", () => {
  return {
    checkFeatureAbilitiesOrThrow: jest.fn(),
  };
});

jest.mock("~/prisma.server", () => {
  return {
    prismaClient: {
      project: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
      profile: {
        findUnique: jest.fn(),
      },
    },
  };
});

const slug = "slug-test";

describe("/project/$slug/settings/delete", () => {
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
      expect.assertions(1);

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

      (prismaClient.project.findUnique as jest.Mock).mockResolvedValueOnce(
        null
      );

      const request = new Request(testURL);
      try {
        await loader({ request, context: {}, params: { slug } });
      } catch (error) {
        const response = error as Response;
        expect(response.status).toBe(404);
      }
    });

    test("authenticated user", async () => {
      expect.assertions(1);

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

      (prismaClient.project.findUnique as jest.Mock).mockResolvedValueOnce({
        id: "some-project-id",
      });

      (prismaClient.project.findFirst as jest.Mock).mockResolvedValueOnce(null);

      try {
        await loader({
          request: new Request(testURL),
          context: {},
          params: { slug },
        });
      } catch (error) {
        const response = error as Response;
        expect(response.status).toBe(403);
      }
    });

    test("admin user", async () => {
      expect.assertions(1);

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

      (prismaClient.project.findUnique as jest.Mock).mockResolvedValueOnce({
        id: "some-project-id",
        name: "some-project-name",
      });

      (prismaClient.project.findFirst as jest.Mock).mockResolvedValueOnce({
        id: "some-project-id",
      });

      const response = await loader({
        request: new Request(testURL),
        context: {},
        params: { slug },
      });
      const responseBody = await response.json();
      expect(responseBody.projectName).toBe("some-project-name");
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

    test("authenticated user", async () => {
      const request = createRequestWithFormData({});

      expect.assertions(1);

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

      (prismaClient.project.findFirst as jest.Mock).mockResolvedValueOnce(null);

      try {
        await action({
          request,
          context: {},
          params: { slug },
        });
      } catch (error) {
        const response = error as Response;
        expect(response.status).toBe(403);
      }
    });

    test("project not found", async () => {
      const request = createRequestWithFormData({ userId: "some-user-id" });

      expect.assertions(1);

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

      (prismaClient.project.findFirst as jest.Mock).mockResolvedValueOnce({
        id: "some-project-id",
      });

      (prismaClient.project.findUnique as jest.Mock).mockResolvedValueOnce(
        null
      );

      try {
        await action({ request, context: {}, params: { slug } });
      } catch (error) {
        const response = error as Response;
        expect(response.status).toBe(404);
      }
    });

    test("profile not found", async () => {
      expect.assertions(1);

      const request = createRequestWithFormData({
        eventName: "some-project-name",
      });

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

      (prismaClient.project.findFirst as jest.Mock).mockResolvedValueOnce({
        id: "some-project-id",
      });

      (prismaClient.project.findUnique as jest.Mock).mockResolvedValueOnce({
        id: "some-project-id",
        name: "some-project-name",
      });

      (prismaClient.profile.findUnique as jest.Mock).mockResolvedValueOnce(
        null
      );

      try {
        await action({ request, context: {}, params: { slug } });
      } catch (error) {
        const response = error as Response;
        expect(response.status).toBe(404);
      }
    });

    test("different project name", async () => {
      expect.assertions(2);

      const request = createRequestWithFormData({
        projectName: "wrong-project-name",
      });

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

      (prismaClient.project.findFirst as jest.Mock).mockResolvedValueOnce({
        id: "some-project-id",
      });

      (prismaClient.project.findUnique as jest.Mock).mockResolvedValueOnce({
        id: "some-project-id",
        name: "some-project-name",
      });

      (prismaClient.profile.findUnique as jest.Mock).mockResolvedValueOnce({
        username: "some-profile-username",
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
      expect.assertions(2);

      const request = createRequestWithFormData({
        projectName: "some-project-name",
      });

      getSessionUserOrThrow.mockResolvedValueOnce({
        id: "some-user-id",
      } as User);

      (prismaClient.project.findFirst as jest.Mock).mockResolvedValueOnce({
        id: "some-project-id",
      });

      (prismaClient.project.findUnique as jest.Mock).mockResolvedValueOnce({
        id: "some-project-id",
        name: "some-project-name",
      });

      (prismaClient.profile.findUnique as jest.Mock).mockResolvedValueOnce({
        username: "someuser",
      });

      const response = await action({
        request,
        context: {},
        params: { slug },
      });

      expect(response).toEqual(redirect("/profile/someuser"));
      expect(prismaClient.project.delete).toHaveBeenLastCalledWith({
        where: {
          slug: slug,
        },
      });
    });
  });
});
