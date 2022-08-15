import { getUserByRequest } from "~/auth.server";
import { createRequestWithFormData } from "~/lib/utils/tests";
import { action, loader } from "./create";

// @ts-ignore
const expect = global.expect as jest.Expect;

const path = "/event/create";

jest.mock("~/auth.server", () => {
  return { getUserByRequest: jest.fn() };
});

jest.mock("~/utils.server", () => {
  return { validateCSRFToken: jest.fn() };
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

describe("action", () => {
  beforeAll(() => {
    process.env.FEATURES = "events";
  });

  test("anon user", async () => {
    expect.assertions(2);

    (getUserByRequest as jest.Mock).mockImplementationOnce(() => {
      return null;
    });

    try {
      await action({
        request: createRequestWithFormData({}),
        context: {},
        params: {},
      });
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(403);

      const json = await response.json();
      expect(json.message).toBe("Not allowed");
    }
  });

  test("other user id", async () => {
    expect.assertions(2);

    (getUserByRequest as jest.Mock).mockImplementationOnce(() => {
      return { id: "some-user-id" };
    });

    try {
      await action({
        request: createRequestWithFormData({ id: "another-user-id" }),
        context: {},
        params: {},
      });
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(403);

      const json = await response.json();
      expect(json.message).toBe("Not allowed");
    }
  });

  test("no values", async () => {
    (getUserByRequest as jest.Mock).mockImplementationOnce(() => {
      return { id: "some-user-id" };
    });

    const request = createRequestWithFormData({
      id: "some-user-id",
      name: "",
      startDate: "",
    });

    const response = await action({ request, context: {}, params: {} });
    expect(response.data.id).toBe("some-user-id");
    expect(response.errors).toBeDefined();
    expect(response.errors).not.toBeNull();
    expect(response.errors.name.message).toBe("Please add event name");
    expect(response.errors.startDate.message).toBe("Please add a start date");
  });

  afterAll(() => {
    delete process.env.FEATURES;
  });
});
