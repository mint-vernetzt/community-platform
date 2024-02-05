import { Request as NodeRequest } from "@remix-run/web-fetch";
import { loader } from "./keycloak.callback";
import { createAdminAuthClient, setSession } from "~/auth.server";
import { prismaClient } from "~/prisma.server";
import { redirect } from "@remix-run/node";
import { redirectWithAlert } from "~/alert.server";

// TODO: fix type issues
// Globals of cypress and jest are conflicting
// @ts-ignore
const expect = global.expect as jest.Expect;

jest.mock("~/auth.server", () => {
  return {
    ...jest.requireActual("~/auth.server"),
    setSession: jest.fn(),
    createAdminAuthClient: jest.fn(),
  };
});

jest.mock("~/prisma.server", () => {
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
  expect(response).toBeNull();
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

  const updateUserById = jest.fn();
  (createAdminAuthClient as jest.Mock).mockReturnValueOnce({
    auth: {
      admin: {
        updateUserById,
      },
    },
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

  const updateUserById = jest.fn();
  (createAdminAuthClient as jest.Mock).mockReturnValueOnce({
    auth: {
      admin: {
        updateUserById,
      },
    },
  });

  const response = await loader({ request, context: {} as any, params: {} });

  expect(response).toStrictEqual(redirect(`/dashboard`));
});

test("user is still registered with email and signs in with keycloak", async () => {
  process.env.SUPABASE_URL = "https://some-url.supabase.co";
  process.env.SERVICE_ROLE_KEY = "some-service-role-key";

  const updateUserById = jest.fn();
  (createAdminAuthClient as jest.Mock).mockReturnValueOnce({
    auth: {
      admin: {
        updateUserById,
      },
    },
  });

  const request = new NodeRequest(
    "http://localhost:3000/auth/keycloak/callback?access_token=123&refresh_token=456&login_redirect=/events/some-event-id"
  );
  (setSession as jest.Mock).mockResolvedValueOnce({
    user: {
      id: "some-user-id",
      email: "email-user@domain.com",
      user_metadata: {
        firstName: "Email",
        lastName: "User",
      },
      app_metadata: {
        provider: "email",
        providers: ["email", "keycloak"],
      },
      identities: [
        {
          id: "some-user-id",
          user_id: "some-user-id",
          provider: "email",
        },
        {
          id: "some-keycloak-user-id",
          user_id: "some-user-id",
          provider: "keycloak",
        },
      ],
    },
  });

  const response = await loader({ request, context: {} as any, params: {} });
  expect(updateUserById).toHaveBeenCalledWith("some-user-id", {
    app_metadata: { provider: "keycloak" },
  });
  expect(response).toStrictEqual(
    await redirectWithAlert(
      `/events/some-event-id`,
      {
        message: "Deine MINT-ID wurde erfolgreich mit Deinem Profil verknüpft.",
      },
      { headers: {} }
    )
  );

  // @ts-ignore - delete global variables
  delete process.env.SUPABASE_URL;
  delete process.env.SERVICE_ROLE_KEY;
});
