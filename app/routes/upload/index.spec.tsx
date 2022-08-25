import { action, loader } from "./index";

// @ts-ignore
const expect = global.expect as jest.Expect;

const path = "/upload";

describe("context", () => {
  test("call loader", async () => {
    const res = await loader({
      request: new Request(path),
      params: {},
      context: {},
    });

    expect(res).toBeNull();
  });

  test("call action", async () => {
    const res = await action({
      request: new Request(path, { method: "POST" }),
      params: {},
      context: {},
    });

    expect(res).toBeNull();
  });
});
