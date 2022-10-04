import { loader } from "./index";

/** @type {jest.Expect} */
// @ts-ignore
const expect = global.expect;

const url = "http://localhost:3000/login";
const urlWithEventRedirect = "http://localhost:3000/login?event_slug=testevent";

test("call loader without custom redirect", async () => {
  const res = await loader({
    request: new Request(url),
    params: {},
    context: {},
  });

  const data = await res.json();

  expect(data).toStrictEqual({
    registerRedirect: "/register?redirect_to=http://localhost:3000/login",
    resetPasswordRedirect:
      "/reset?redirect_to=http://localhost:3000/reset/set-password?redirect_to=http://localhost:3000/login",
  });
});

test("call loader with redirect to event", async () => {
  const res = await loader({
    request: new Request(urlWithEventRedirect),
    params: {},
    context: {},
  });

  const data = await res.json();

  expect(data).toStrictEqual({
    loginSuccessRedirect: "/event/testevent",
    loginFailureRedirect: "/login?event_slug=testevent",
    registerRedirect:
      "/register?redirect_to=http://localhost:3000/login?event_slug=testevent",
    resetPasswordRedirect:
      "/reset?redirect_to=http://localhost:3000/reset/set-password?redirect_to=http://localhost:3000/login?event_slug=testevent",
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
