import { redirect } from "@remix-run/node";
import { createRequestWithFormData, testURL } from "~/lib/utils/tests";
import * as authServerModule from "~/auth.server";
import { generateEventSlug } from "~/utils";
import { action, loader } from "./create";
import * as crypto from "crypto";
import { createEventOnProfile } from "./utils.server";
import type { User } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/auth-helpers-remix";

// @ts-ignore
const expect = global.expect as jest.Expect;

const path = "/event/create";

const getSessionUserOrThrow = jest.spyOn(
  authServerModule,
  "getSessionUserOrThrow"
);

jest.mock("@supabase/auth-helpers-remix", () => {
  return { createServerClient: jest.fn() };
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

    (createServerClient as jest.Mock).mockResolvedValue(null);

    try {
      await loader({ request: new Request(testURL), params: {}, context: {} });
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(403);

      const json = await response.json();
      expect(json.message).toBe("Not allowed");
    }
  });

  test("logged in user", async () => {
    getSessionUserOrThrow.mockResolvedValue({ id: "some-user-id" } as User);

    const url = `https://someurl.io${path}`;

    const response = await loader({
      request: new Request(url),
      params: {},
      context: {},
    });
    const responseBody = await response.json();
    expect(responseBody.id).toBe("some-user-id");
  });

  test("search parameters", async () => {
    getSessionUserOrThrow.mockResolvedValue({ id: "some-user-id" } as User);

    const url = `https://someurl.io${path}`;

    const resultWithoutParameters = await loader({
      request: new Request(url),
      params: {},
      context: {},
    });
    expect(resultWithoutParameters.child).toBe("");
    expect(resultWithoutParameters.parent).toBe("");

    const resultWithParameters = await loader({
      request: new Request(
        `${url}?child=child-event-id&parent=parent-event-id`
      ),
      params: {},
      context: {},
    });
    expect(resultWithParameters.child).toBe("child-event-id");
    expect(resultWithParameters.parent).toBe("parent-event-id");
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

    getSessionUserOrThrow.mockResolvedValue({ id: "some-user-id" } as User);

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

    getSessionUserOrThrow.mockResolvedValue({ id: "some-user-id" } as User);

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
    getSessionUserOrThrow.mockResolvedValue({ id: "some-user-id" } as User);

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

    getSessionUserOrThrow.mockResolvedValue({ id: uuid } as User);

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

    expect(createEventOnProfile).toHaveBeenLastCalledWith(
      uuid,
      {
        slug: "some-slug",
        name: "Some Event",
        startTime,
        endTime: startTime,
        participationUntil: startTime,
      },
      { parent: null, child: null }
    );

    expect(response).toEqual(redirect("/event/some-slug"));
  });

  test("all fields", async () => {
    const uuid = crypto.randomUUID();

    getSessionUserOrThrow.mockResolvedValue({ id: uuid } as User);

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

    expect(createEventOnProfile).toHaveBeenLastCalledWith(
      uuid,
      {
        slug: "some-slug",
        name: "Some Event",
        startTime,
        endTime,
        participationUntil: startTime,
      },
      { parent: null, child: null }
    );

    expect(response).toEqual(redirect("/event/some-slug"));
  });

  test("all fields with relations", async () => {
    const uuid = crypto.randomUUID();

    getSessionUserOrThrow.mockResolvedValue({ id: uuid } as User);

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
      child: "child-event-id",
      parent: "parent-event-id",
    });

    const startTime = new Date("2022-09-19 09:00");
    const endTime = new Date("2022-09-20 18:00");

    const response = await action({ request, context: {}, params: {} });

    expect(createEventOnProfile).toHaveBeenLastCalledWith(
      uuid,
      {
        slug: "some-slug",
        name: "Some Event",
        startTime,
        endTime,
        participationUntil: startTime,
      },
      { parent: "parent-event-id", child: "child-event-id" }
    );

    expect(response).toEqual(redirect("/event/some-slug"));
  });

  afterAll(() => {
    delete process.env.FEATURES;
  });
});
