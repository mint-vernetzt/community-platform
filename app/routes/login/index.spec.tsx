import { action, loader } from "./index";

const path = "/login";

test("call loader", async () => {
  const res = await loader({
    request: new Request(path),
    params: {},
    context: {},
  });

  expect(res).toBeNull();
});

test("handle empty email and/or password", async () => {
  const responseEmpty: Response = await action({
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
});
