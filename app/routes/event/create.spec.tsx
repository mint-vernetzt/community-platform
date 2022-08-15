import { redirect } from "remix";
import { getUserByRequest } from "~/auth.server";
import { createRequestWithFormData } from "~/lib/utils/tests";
import { generateEventSlug } from "~/utils";
import { action, loader } from "./create";
import * as crypto from "crypto";
import { createEventOnProfile } from "./utils.server";

// @ts-ignore
const expect = global.expect as jest.Expect;

const path = "/event/create";

jest.mock("~/auth.server", () => {
  return { getUserByRequest: jest.fn() };
});

jest.mock("~/utils", () => {
  return { generateEventSlug: jest.fn() };
});

jest.mock("./utils.server", () => {
  return { createEventOnProfile: jest.fn() };
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

  test("required fields", async () => {
    const uuid = crypto.randomUUID();

    (getUserByRequest as jest.Mock).mockImplementationOnce(() => {
      return { id: uuid };
    });

    (generateEventSlug as jest.Mock).mockImplementationOnce(() => {
      return "some-slug";
    });

    const request = createRequestWithFormData({
      id: uuid,
      name: "Some Event",
      startDate: "2022-09-19",
    });

    const startTime = new Date("2022-09-19 00:00");

    const response = await action({ request, context: {}, params: {} });

    expect(createEventOnProfile).toHaveBeenLastCalledWith(uuid, {
      slug: "some-slug",
      name: "Some Event",
      startTime,
      endTime: startTime,
      participationUntil: startTime,
    });

    expect(response).toEqual(redirect("/event/some-slug"));
  });

  test("all fields", async () => {
    const uuid = crypto.randomUUID();

    (getUserByRequest as jest.Mock).mockImplementationOnce(() => {
      return { id: uuid };
    });

    (generateEventSlug as jest.Mock).mockImplementationOnce(() => {
      return "some-slug";
    });

    const request = createRequestWithFormData({
      id: uuid,
      name: "Some Event",
      startDate: "2022-09-19",
      startTime: "09:00",
      endDate: "2022-09-20",
      endTime: "18:00",
    });

    const startTime = new Date("2022-09-19 09:00");
    const endTime = new Date("2022-09-20 18:00");

    const response = await action({ request, context: {}, params: {} });

    expect(createEventOnProfile).toHaveBeenLastCalledWith(uuid, {
      slug: "some-slug",
      name: "Some Event",
      startTime,
      endTime,
      participationUntil: startTime,
    });

    expect(response).toEqual(redirect("/event/some-slug"));
  });

  afterAll(() => {
    delete process.env.FEATURES;
  });
});
