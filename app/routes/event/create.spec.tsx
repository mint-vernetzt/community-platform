import { getUserByRequest } from "~/auth.server";
import { loader } from "./create";

// @ts-ignore
const expect = global.expect as jest.Expect;

const path = "/event/create";

jest.mock("~/auth.server", () => {
  return { getUserByRequest: jest.fn() };
});

describe("loader", () => {
  beforeAll(() => {
    process.env.FEATURES = "events";
  });

  test("anon user", async () => {
    expect.assertions(2);

    (getUserByRequest as jest.Mock).mockImplementationOnce(() => {
      return null;
    });

    try {
      await loader({ request: new Request(path), params: {}, context: {} });
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(403);

      const json = await response.json();
      expect(json.message).toBe("Not allowed");
    }
  });

  test("logged in user", async () => {
    (getUserByRequest as jest.Mock).mockImplementation(() => {
      return { id: "some-user-id" };
    });

    const result = await loader({
      request: new Request(path),
      params: {},
      context: {},
    });
    expect(result.id).toBe("some-user-id");
  });

  afterAll(() => {
    delete process.env.FEATURES;
  });
});
