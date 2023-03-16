import { redirect } from "@remix-run/node";
// import { createServerClient } from "@supabase/auth-helpers-remix";
import { getSessionUser, setSession, signIn } from "~/auth.server";
import { createRequestWithFormData, testURL } from "~/lib/utils/tests";
import { prismaClient } from "~/prisma";
import { action, loader } from "./index";

/** @type {jest.Expect} */
// @ts-ignore
const expect = global.expect;

jest.mock("~/prisma", () => {
  return {
    prismaClient: {
      profile: {
        findUnique: jest.fn(),
      },
    },
  };
});

jest.mock("~/auth.server", () => {
  return {
    ...jest.requireActual("~/auth.server"),
    getSessionUser: jest.fn(),
    signIn: jest.fn(),
    setSession: jest.fn(),
  };
});

const url = testURL;
const urlWithLoginRedirect = `${testURL}/?login_redirect=${testURL}/event/some-event-slug`;
const urlWithTokens = `${testURL}/?access_token=abcde&refresh_token=fghij`;
const urlWithTokensAfterEmailChange = `${testURL}/?access_token=abcde&refresh_token=fghij&type=sign_up`;

const actionRequest = createRequestWithFormData({
  email: "some@email.de",
  password: "some-password",
});

const actionRequestWithRedirect = createRequestWithFormData({
  email: "some@email.de",
  password: "some-password",
  loginRedirect: `${testURL}/event/some-event-slug`,
});

test("redirect on existing session", async () => {
  (getSessionUser as jest.Mock).mockImplementationOnce(() => {
    return {
      id: "some-user-id",
      email: "user@user.de",
    };
  });

  const res = await loader({
    request: new Request(url),
    params: {},
    context: {},
  });

  expect(res).toStrictEqual(redirect("/explore?reason=3"));
});

test("redirect on existing session with login redirect param", async () => {
  (getSessionUser as jest.Mock).mockImplementationOnce(() => {
    return {
      id: "some-user-id",
      email: "user@user.de",
    };
  });

  const res = await loader({
    request: new Request(urlWithLoginRedirect),
    params: {},
    context: {},
  });

  expect(res).toStrictEqual(redirect(`${testURL}/event/some-event-slug`));
});

test("set new session in loader with token params", async () => {
  (setSession as jest.Mock).mockImplementationOnce(() => {
    return {
      user: {
        id: "some-user-id",
        email: "user@user.de",
      },
    };
  });

  (getSessionUser as jest.Mock).mockImplementationOnce(() => {
    return {
      id: "some-user-id",
      email: "user@user.de",
    };
  });

  const res = await loader({
    request: new Request(urlWithTokens),
    params: {},
    context: {},
  });

  expect(res).toStrictEqual(redirect("/explore?reason=3"));
});

test("set new session in loader with token params after sign up confirmation", async () => {
  (setSession as jest.Mock).mockImplementationOnce(() => {
    return {
      user: {
        id: "some-user-id",
      },
    };
  });

  (prismaClient.profile.findUnique as jest.Mock).mockImplementationOnce(() => {
    return {
      username: "some-username",
    };
  });

  const res = await loader({
    request: new Request(urlWithTokensAfterEmailChange),
    params: {},
    context: {},
  });

  expect(res).toStrictEqual(redirect("/profile/some-username"));
});

test("call login action success with login redirect param", async () => {
  (signIn as jest.Mock).mockImplementationOnce(() => {
    return { error: null };
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
    return { error: null };
  });

  const res = await action({
    request: actionRequest,
    params: {},
    context: {},
  });

  expect(res).toStrictEqual(redirect("/explore?reason=4"));
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
