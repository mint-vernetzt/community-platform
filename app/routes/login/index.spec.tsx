import { redirect } from "@remix-run/node";
// import { createServerClient } from "@supabase/auth-helpers-remix";
import { getSessionUser, signIn, createAdminAuthClient } from "~/auth.server";
import { createRequestWithFormData, testURL } from "~/lib/utils/tests";
import { prismaClient } from "~/prisma.server";
import { action, loader } from "./index";

// TODO: fix type issues
// Globals of cypress and jest are conflicting
// @ts-ignore
const expect = global.expect as jest.Expect;

jest.mock("~/prisma.server", () => {
  return {
    prismaClient: {
      profile: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
    },
  };
});

jest.mock("~/auth.server", () => {
  return {
    ...jest.requireActual("~/auth.server"),
    getSessionUser: jest.fn(),
    createAdminAuthClient: jest.fn(),
    signIn: jest.fn(),
    setSession: jest.fn(),
  };
});

const url = testURL;

const actionRequest = createRequestWithFormData({
  email: "some@email.de",
  password: "some-password",
});

const actionRequestWithRedirect = createRequestWithFormData({
  email: "some@email.de",
  password: "some-password",
  loginRedirect: `${testURL}/event/some-event-slug`,
});

beforeAll(() => {
  delete process.env.FEATURE_FLAGS;
});

test("redirect on existing session", async () => {
  (getSessionUser as jest.Mock).mockImplementationOnce(() => {
    return {
      id: "some-user-id",
      email: "user@user.de",
    };
  });

  (prismaClient.profile.findUnique as jest.Mock).mockImplementationOnce(() => {
    return {
      username: "some-username",
    };
  });

  const res = await loader({
    request: new Request(url),
    params: {},
    context: {},
  });

  expect(res).toStrictEqual(redirect("/dashboard"));
});

test("call login action success with login redirect param", async () => {
  (signIn as jest.Mock).mockImplementationOnce(() => {
    return {
      error: null,
    };
  });

  (prismaClient.profile.findFirst as jest.Mock).mockImplementationOnce(() => {
    return {
      id: "some-user-id",
      username: "some-username",
    };
  });

  const updateUserById = jest.fn();
  (createAdminAuthClient as jest.Mock).mockReturnValueOnce({
    auth: {
      admin: {
        updateUserById,
      },
    },
  });

  const res = await action({
    request: actionRequestWithRedirect,
    params: {},
    context: {},
  });

  expect(res).toStrictEqual(redirect(`${testURL}/event/some-event-slug`));
});

test("call login action success with default redirect", async () => {
  (signIn as jest.Mock).mockImplementationOnce(() => {
    return {
      error: null,
    };
  });

  (prismaClient.profile.findFirst as jest.Mock).mockImplementationOnce(() => {
    return {
      id: "some-user-id",
      username: "some-username",
    };
  });

  const updateUserById = jest.fn();
  (createAdminAuthClient as jest.Mock).mockReturnValueOnce({
    auth: {
      admin: {
        updateUserById,
      },
    },
  });

  (getSessionUser as jest.Mock).mockImplementationOnce(() => {
    return {
      user: {
        id: "some-user-id",
        email: "user@user.de",
      },
    };
  });

  (prismaClient.profile.findUnique as jest.Mock).mockImplementationOnce(() => {
    return {
      username: "some-username",
    };
  });

  const res = await action({
    request: actionRequest,
    params: {},
    context: {},
  });

  expect(res).toStrictEqual(redirect("/dashboard"));
});

test("call login action with wrong credentials", async () => {
  (signIn as jest.Mock).mockImplementationOnce(() => {
    return {
      error: {
        message: "Invalid login credentials",
      },
    };
  });

  const res = await action({
    request: actionRequest,
    params: {},
    context: {},
  });

  const data = await res.json();

  expect(data).toStrictEqual({
    errors: {
      _global: [
        "Deine Anmeldedaten (E-Mail oder Passwort) sind nicht korrekt. Bitte überprüfe Deine Eingaben.",
      ],
      email: [],
      loginRedirect: [],
      password: [],
    },
    success: false,
    values: {
      email: "some@email.de",
      password: "some-password",
    },
  });
});

test("call login action causing auth api error", async () => {
  (signIn as jest.Mock).mockImplementationOnce(() => {
    return {
      error: {
        message: "some-auth-api-error",
      },
    };
  });

  const res = await action({
    request: actionRequest,
    params: {},
    context: {},
  });

  const data = await res.json();

  expect(data).toStrictEqual({
    errors: {
      _global: ["some-auth-api-error"],
      email: [],
      loginRedirect: [],
      password: [],
    },
    success: false,
    values: {
      email: "some@email.de",
      password: "some-password",
    },
  });
});

afterAll(() => {
  delete process.env.FEATURE_FLAGS;
});

/* TODO: run e2e test
test("handle empty body", async () => {
  const responseEmpty = await action({
    request: new Request(path, { method: "POST" }),
    params: {},
    context: {},
  });
  expect(responseEmpty.status).toBe(400);
});

test("handle empty email and/or password", async () => {
  const responseEmpty = await action({
    request: new Request(path, { method: "POST", body: new FormData() }),
    params: {},
    context: {},
  });
  expect(responseEmpty.status).toBe(400);

  const formData = new FormData();
  formData.append("email", "");
  formData.append("password", "");
  const responseEmptyString = await action({
    request: new Request(path, {
      method: "POST",
      body: formData,
    }),
    params: {},
    context: {},
  });
  expect(responseEmptyString.status).toBe(400);
});*/
