import { action, loader } from "./index";

const path = "/reset";

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
