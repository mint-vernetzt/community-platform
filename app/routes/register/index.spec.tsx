/** @type {jest.Expect} */
// @ts-ignore
const expect = global.expect;

// TODO: write tests

describe("context", () => {
  test("call loader", async () => {
    // const res = await loader({
    //   request: new Request(path),
    //   params: {},
    //   context: {},
    // });
    // expect(res).toBeNull();
  });

  test("call action", async () => {
    // Use create request with formData method from lib test utils
    // const res = await action({
    //   request: new Request(path, { method: "POST" }),
    //   params: {},
    //   context: {},
    // });
    // expect(res).toBeNull();
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
