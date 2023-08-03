import { Request as NodeRequest } from "@remix-run/web-fetch";
import { loader } from "./keycloak.callback";
import { setSession } from "~/auth.server";
import { prismaClient } from "~/prisma";
import { redirect } from "@remix-run/node";

jest.mock("~/auth.server", () => {
  return {
    ...jest.requireActual("~/auth.server"),
    setSession: jest.fn(),
  };
});

jest.mock("~/prisma", () => {
  return {
    prismaClient: {
      profile: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      // legacy
      profileVisibility: {
        findFirst: jest.fn(),
      },
    },
  };
});

test("no access_token or refresh_token", async () => {
  const request = new NodeRequest(
    "http://localhost:3000/auth/keycloak/callback"
  );

  const response = await loader({ request, context: {} as any, params: {} });

  expect(false).toBeTruthy();
});

test("user newly registered with keycloak", async () => {
  const request = new NodeRequest(
    "http://localhost:3000/auth/keycloak/callback?access_token=123&refresh_token=456"
  );
  (setSession as jest.Mock).mockResolvedValueOnce({
    user: {
      id: "some-user-id",
      email: "keycloak-user@domain.com",
      user_metadata: {
        full_name: "Keycloak User",
      },
      app_metadata: {
        provider: "keycloak",
        providers: ["keycloak"],
      },
      identities: [
        {
          id: "some-keycloak-user-id",
          user_id: "some-user-id",
          provider: "keycloak",
        },
      ],
    },
  });

  (prismaClient.profile.findFirst as jest.Mock).mockResolvedValueOnce(null);
  (prismaClient.profile.create as jest.Mock).mockResolvedValueOnce({
    username: "keycloakuser",
  });

  const response = await loader({ request, context: {} as any, params: {} });

  expect(response).toStrictEqual(redirect(`/profile/keycloakuser`));
});

test("user signs in with keycloak", async () => {
  const request = new NodeRequest(
    "http://localhost:3000/auth/keycloak/callback?access_token=123&refresh_token=456"
  );
  (setSession as jest.Mock).mockResolvedValueOnce({
    user: {
      id: "some-user-id",
      email: "keycloak-user@domain.com",
      user_metadata: {
        full_name: "Keycloak User",
      },
      app_metadata: {
        provider: "keycloak",
        providers: ["keycloak"],
      },
      identities: [
        {
          id: "some-keycloak-user-id",
          user_id: "some-user-id",
          provider: "keycloak",
        },
      ],
    },
  });

  (prismaClient.profile.findFirst as jest.Mock).mockResolvedValueOnce({
    id: "some-user-id",
    username: "keycloakuser",
  });
  // legacy
  (prismaClient.profileVisibility.findFirst as jest.Mock).mockResolvedValueOnce(
    {
      profileId: "some-user-id",
    }
  );

  const response = await loader({ request, context: {} as any, params: {} });

  expect(response).toStrictEqual(redirect(`/dashboard`));
});
