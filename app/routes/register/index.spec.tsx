import { loader } from "./index";

/** @type {jest.Expect} */
// @ts-ignore
const expect = global.expect;

const url = "http://www.community.org/register";
const urlWithRedirectToLogin =
  "http://www.community.org/register?redirect_to=http://www.testpage.org/login";
const urlWithRedirectToLoginAndEvent =
  "http://www.community.org/register?redirect_to=http://www.testpage.org/login?event_slug=testevent";

test("call loader without redirect", async () => {
  const res = await loader({
    request: new Request(url),
    params: {},
    context: {},
  });

  expect(res).toStrictEqual({
    redirectToAfterRegister: null,
    loginRedirect: undefined,
  });
});

test("call loader with redirect parameter to login", async () => {
  const res = await loader({
    request: new Request(urlWithRedirectToLogin),
    params: {},
    context: {},
  });

  expect(res).toStrictEqual({
    redirectToAfterRegister: "http://www.testpage.org/login",
    loginRedirect: undefined,
  });
});

test("call loader with redirect parameter to login and event", async () => {
  const res = await loader({
    request: new Request(urlWithRedirectToLoginAndEvent),
    params: {},
    context: {},
  });

  expect(res).toStrictEqual({
    redirectToAfterRegister:
      "http://www.testpage.org/login?event_slug=testevent",
    loginRedirect: "/login?event_slug=testevent",
  });
});

/* TODO: run e2e test
jest.mock("../../auth.server", () => {
  return {
    // eslint-disable-next-line
    signUp: jest.fn().mockImplementation(() => {
      return {};
    }),
  };
});

test("call loader", async () => {
  const res = await loader({
    request: new Request(path),
    params: {},
    context: {},
  });

  expect(res).toBeNull();
});

test("handle empty body", async () => {
  const responseEmpty = await action({
    request: new Request(path, { method: "POST" }),
    params: {},
    context: {},
  });
  expect(responseEmpty.status).toBe(400);
});

test("handle empty fields", async () => {
  const responseEmpty = await action({
    request: new Request(path, { method: "POST", body: new FormData() }),
    params: {},
    context: {},
  });
  expect(responseEmpty.status).toBe(400);

  const formData = new FormData();
  formData.append("email", "");
  formData.append("password", "");
  formData.append("firstName", "");
  formData.append("lastName", "");
  formData.append("termsAccepted", "");
  const responseEmptyString = await action({
    request: new Request(path, {
      method: "POST",
      body: formData,
    }),
    params: {},
    context: {},
  });
  expect(responseEmptyString.status).toBe(400);
});

test("academic title can be empty empty fields", async () => {
  const formData = new FormData();
  formData.append("email", "hello@someemail.dev");
  formData.append("password", "pa$$w0rd");
  formData.append("firstName", "John");
  formData.append("lastName", "Doe");
  formData.append("termsAccepted", "on");
  const responseEmpty = await action({
    request: new Request(path, { method: "POST", body: formData }),
    params: {},
    context: {},
  });
  expect(responseEmpty.status).not.toBe(400);
});*/
