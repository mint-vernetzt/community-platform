import { redirect } from "@remix-run/node";
import type { User } from "@supabase/supabase-js";
import * as crypto from "crypto";
import * as authServerModule from "~/auth.server";
import { createRequestWithFormData, testURL } from "~/lib/utils/tests";
import { prismaClient } from "~/prisma";
import { generateEventSlug } from "~/utils";
import { action, loader } from "./create";
import { createEventOnProfile } from "./utils.server";

// @ts-ignore
const expect = global.expect as jest.Expect;

const path = "/event/create";

const getSessionUserOrThrow = jest.spyOn(
  authServerModule,
  "getSessionUserOrThrow"
);

jest.mock("~/utils", () => {
  return { generateEventSlug: jest.fn() };
});

jest.mock("./utils.server", () => {
  return {
    ...jest.requireActual("./utils.server"),
    createEventOnProfile: jest.fn(),
  };
});

jest.mock("~/prisma", () => {
  return {
    prismaClient: {
      event: {
        findFirst: jest.fn(),
      },
    },
  };
});

describe("loader", () => {
  beforeAll(() => {
    process.env.FEATURES = "events";
  });

  test("anon user", async () => {
    expect.assertions(2);

    try {
      await loader({ request: new Request(testURL), params: {}, context: {} });
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json.message).toBe("No session or session user found");
    }
  });

  test("logged in user", async () => {
    getSessionUserOrThrow.mockResolvedValueOnce({ id: "some-user-id" } as User);

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
    getSessionUserOrThrow.mockResolvedValueOnce({ id: "some-user-id" } as User);

    const url = `https://someurl.io${path}`;

    const responseWithoutParameters = await loader({
      request: new Request(url),
      params: {},
      context: {},
    });
    const responseWithoutParametersBody =
      await responseWithoutParameters.json();
    expect(responseWithoutParametersBody.child).toBe("");
    expect(responseWithoutParametersBody.parent).toBe("");

    getSessionUserOrThrow.mockResolvedValueOnce({ id: "some-user-id" } as User);

    const responseWithParameters = await loader({
      request: new Request(
        `${url}?child=child-event-id&parent=parent-event-id`
      ),
      params: {},
      context: {},
    });
    const responseWithParametersBody = await responseWithParameters.json();
    expect(responseWithParametersBody.child).toBe("child-event-id");
    expect(responseWithParametersBody.parent).toBe("parent-event-id");
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

    try {
      await action({
        request: createRequestWithFormData({}),
        context: {},
        params: {},
      });
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json.message).toBe("No session or session user found");
    }
  });

  test("other user id", async () => {
    expect.assertions(2);

    getSessionUserOrThrow.mockResolvedValueOnce({ id: "some-user-id" } as User);

    try {
      await action({
        request: createRequestWithFormData({ userId: "another-user-id" }),
        context: {},
        params: {},
      });
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json.message).toBe("Identity check failed");
    }
  });

  test("no values", async () => {
    getSessionUserOrThrow.mockResolvedValueOnce({ id: "some-user-id" } as User);

    const request = createRequestWithFormData({
      userId: "some-user-id",
      name: "",
      startDate: "",
      startTime: "",
      endDate: "",
      endTime: "",
    });

    (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
      return null;
    });

    const response = await action({ request, context: {}, params: {} });
    const responseBody = await response.json();
    expect(responseBody.data.userId).toBe("some-user-id");
    expect(responseBody.errors).toBeDefined();
    expect(responseBody.errors).not.toBeNull();
    expect(responseBody.errors.name.message).toBe(
      "Bitte einen Veranstaltungsnamen angeben"
    );
    expect(responseBody.errors.startDate.message).toBe(
      "Bitte gib den Beginn der Veranstaltung an"
    );
    expect(responseBody.errors.startTime.message).toBe(
      "Bitte eine Startzeit angeben"
    );
    expect(responseBody.errors.endDate.message).toBe(
      "Bitte gib das Ende der Veranstaltung an"
    );
    expect(responseBody.errors.endTime.message).toBe(
      "Bitte gib das Ende der Veranstaltung an"
    );
  });
  test("invalid time values (end before start", async () => {
    getSessionUserOrThrow.mockResolvedValueOnce({ id: "some-user-id" } as User);

    const request = createRequestWithFormData({
      userId: "some-user-id",
      name: "some-event",
      startDate: "2022-09-20",
      startTime: "09:00",
      endDate: "2022-09-20",
      endTime: "09:00",
    });

    (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
      return null;
    });

    const response = await action({ request, context: {}, params: {} });
    const responseBody = await response.json();
    expect(responseBody.data.userId).toBe("some-user-id");
    expect(responseBody.errors).toBeDefined();
    expect(responseBody.errors).not.toBeNull();
    expect(responseBody.errors.endTime.message).toBe(
      "Die Veranstaltung findet an einem Tag statt. Dabei darf die Startzeit nicht nach der Endzeit liegen"
    );
  });
  test("invalid time values (not in parent time span)", async () => {
    getSessionUserOrThrow.mockResolvedValueOnce({ id: "some-user-id" } as User);

    const request = createRequestWithFormData({
      userId: "some-user-id",
      name: "some-event",
      startDate: "2022-09-19",
      startTime: "09:00",
      endDate: "2022-09-20",
      endTime: "09:00",
      parent: "some-parent-id",
    });

    (prismaClient.event.findFirst as jest.Mock)
      .mockReset()
      .mockImplementationOnce(() => {
        return {
          startTime: new Date("2022-10-18 07:00Z"),
          endTime: new Date("2022-10-21 16:00Z"),
        };
      });

    const response = await action({ request, context: {}, params: {} });
    const responseBody = await response.json();
    expect(responseBody.data.userId).toBe("some-user-id");
    expect(responseBody.errors).toBeDefined();
    expect(responseBody.errors).not.toBeNull();

    expect(responseBody.errors.endDate).toBeDefined();
  });

  test("required fields", async () => {
    const uuid = crypto.randomUUID();

    getSessionUserOrThrow
      .mockReset()
      .mockResolvedValueOnce({ id: uuid } as User);

    (generateEventSlug as jest.Mock).mockImplementationOnce(() => {
      return "some-slug";
    });

    const request = createRequestWithFormData({
      userId: uuid,
      name: "Some Event",
      startDate: "2022-09-19",
      startTime: "09:00",
      endDate: "2022-09-19",
      endTime: "10:00",
    });

    const startTime = new Date("2022-09-19 07:00Z");
    const endTime = new Date("2022-09-19 08:00Z");
    // participation from defaults to one day before event start
    const participationFrom = new Date("2022-09-18 07:00Z");

    const response = await action({ request, context: {}, params: {} });

    expect(createEventOnProfile).toHaveBeenLastCalledWith(
      uuid,
      {
        slug: "some-slug",
        name: "Some Event",
        startTime,
        endTime,
        participationUntil: startTime,
        participationFrom: participationFrom,
      },
      { parent: null, child: null }
    );

    expect(response).toEqual(redirect("/event/some-slug"));
  });

  test("all fields", async () => {
    const uuid = crypto.randomUUID();

    getSessionUserOrThrow.mockResolvedValueOnce({ id: uuid } as User);

    (generateEventSlug as jest.Mock).mockImplementationOnce(() => {
      return "some-slug";
    });

    const request = createRequestWithFormData({
      userId: uuid,
      name: "Some Event",
      startDate: "2022-09-19",
      startTime: "09:00",
      endDate: "2022-09-20",
      endTime: "18:00",
    });

    const startTime = new Date("2022-09-19 07:00Z");
    const endTime = new Date("2022-09-20 16:00Z");
    // participation from defaults to one day before event start
    const participationFrom = new Date("2022-09-18 07:00Z");

    const response = await action({ request, context: {}, params: {} });

    expect(createEventOnProfile).toHaveBeenLastCalledWith(
      uuid,
      {
        slug: "some-slug",
        name: "Some Event",
        startTime,
        endTime,
        participationUntil: startTime,
        participationFrom,
      },
      { parent: null, child: null }
    );

    expect(response).toEqual(redirect("/event/some-slug"));
  });

  test("all fields with relations", async () => {
    const uuid = crypto.randomUUID();

    getSessionUserOrThrow.mockResolvedValueOnce({ id: uuid } as User);

    (generateEventSlug as jest.Mock).mockImplementationOnce(() => {
      return "some-slug";
    });

    (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
      return {
        startTime: new Date("2022-09-18 07:00Z"),
        endTime: new Date("2022-09-21 16:00Z"),
      };
    });

    const request = createRequestWithFormData({
      userId: uuid,
      name: "Some Event",
      startDate: "2022-09-19",
      startTime: "09:00",
      endDate: "2022-09-20",
      endTime: "18:00",
      child: "child-event-id",
      parent: "parent-event-id",
    });

    const startTime = new Date("2022-09-19 07:00Z");
    const endTime = new Date("2022-09-20 16:00Z");
    // participation from defaults to one day before event start
    const participationFrom = new Date("2022-09-18 07:00Z");

    const response = await action({ request, context: {}, params: {} });

    expect(createEventOnProfile).toHaveBeenLastCalledWith(
      uuid,
      {
        slug: "some-slug",
        name: "Some Event",
        startTime,
        endTime,
        participationUntil: startTime,
        participationFrom,
      },
      { parent: "parent-event-id", child: "child-event-id" }
    );

    expect(response).toEqual(redirect("/event/some-slug"));
  });

  afterAll(() => {
    delete process.env.FEATURES;
  });
});
