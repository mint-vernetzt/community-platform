import { redirect } from "@remix-run/node";
import type { User } from "@supabase/supabase-js";
import * as authServerModule from "~/auth.server";
import { createRequestWithFormData, testURL } from "~/lib/utils/tests";
import { prismaClient } from "~/prisma.server";
import { generateEventSlug } from "~/utils.server";
import { action, loader } from "./create";
import { createEventOnProfile } from "./utils.server";

// @ts-ignore
const expect = global.expect as jest.Expect;

const getSessionUserOrThrow = jest.spyOn(
  authServerModule,
  "getSessionUserOrThrow"
);

jest.mock("./utils.server", () => {
  return {
    ...jest.requireActual("./utils.server"),
    createEventOnProfile: jest.fn(),
  };
});

jest.mock("~/utils.server", () => {
  return {
    ...jest.requireActual("./utils.server"),
    generateEventSlug: jest.fn(),
  };
});

jest.mock("~/prisma.server", () => {
  return {
    prismaClient: {
      event: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
    },
  };
});

jest.mock("~/lib/utils/application", () => {
  return {
    checkFeatureAbilitiesOrThrow: jest.fn(),
  };
});

describe("loader", () => {
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

  test("authenticated user without parent or child search params", async () => {
    expect.assertions(2);
    getSessionUserOrThrow.mockResolvedValueOnce({ id: "some-user-id" } as User);

    const response = await loader({
      request: new Request(testURL),
      params: {},
      context: {},
    });
    const responseBody = await response.json();
    expect(responseBody.child).toBe("");
    expect(responseBody.parent).toBe("");
  });

  test("authenticated user with parent or child search params", async () => {
    expect.assertions(2);
    getSessionUserOrThrow.mockResolvedValueOnce({ id: "some-user-id" } as User);

    const response = await loader({
      request: new Request(
        `${testURL}?child=some-child-id&parent=some-parent-id`
      ),
      params: {},
      context: {},
    });
    const responseBody = await response.json();
    expect(responseBody.child).toBe("some-child-id");
    expect(responseBody.parent).toBe("some-parent-id");
  });
});

describe("action", () => {
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

  test("no values", async () => {
    expect.assertions(7);
    getSessionUserOrThrow.mockResolvedValueOnce({ id: "some-user-id" } as User);

    const request = createRequestWithFormData({
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
    expect.assertions(3);
    getSessionUserOrThrow.mockResolvedValueOnce({ id: "some-user-id" } as User);

    const request = createRequestWithFormData({
      name: "some-event",
      startDate: "2022-09-20",
      startTime: "09:00",
      endDate: "2022-09-20",
      endTime: "09:00",
    });

    const response = await action({ request, context: {}, params: {} });
    const responseBody = await response.json();
    expect(responseBody.errors).toBeDefined();
    expect(responseBody.errors).not.toBeNull();
    expect(responseBody.errors.endTime.message).toBe(
      "Die Veranstaltung findet an einem Tag statt. Dabei darf die Startzeit nicht nach der Endzeit liegen"
    );
  });
  test("invalid time values (not in parent time span)", async () => {
    expect.assertions(3);
    getSessionUserOrThrow.mockResolvedValueOnce({ id: "some-user-id" } as User);

    const request = createRequestWithFormData({
      name: "some-event",
      startDate: "2022-09-19",
      startTime: "09:00",
      endDate: "2022-09-20",
      endTime: "09:00",
      parent: "some-parent-id",
    });

    (prismaClient.event.findUnique as jest.Mock).mockImplementationOnce(() => {
      return {
        startTime: new Date("2022-10-18 07:00Z"),
        endTime: new Date("2022-10-21 16:00Z"),
      };
    });

    const response = await action({ request, context: {}, params: {} });
    const responseBody = await response.json();
    expect(responseBody.errors).toBeDefined();
    expect(responseBody.errors).not.toBeNull();

    expect(responseBody.errors.endDate).toBeDefined();
  });

  test("required fields", async () => {
    expect.assertions(2);
    getSessionUserOrThrow.mockResolvedValueOnce({ id: "some-user-id" } as User);

    const request = createRequestWithFormData({
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

    (generateEventSlug as jest.Mock).mockImplementationOnce(() => "some-slug");

    const response = await action({ request, context: {}, params: {} });

    expect(createEventOnProfile).toHaveBeenCalledWith(
      "some-user-id",
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
    expect.assertions(2);
    getSessionUserOrThrow.mockResolvedValueOnce({ id: "some-user-id" } as User);

    (generateEventSlug as jest.Mock).mockImplementationOnce(() => {
      return "some-slug";
    });

    const request = createRequestWithFormData({
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
      "some-user-id",
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
    expect.assertions(2);
    getSessionUserOrThrow.mockResolvedValueOnce({ id: "some-user-id" } as User);

    (generateEventSlug as jest.Mock).mockImplementationOnce(() => {
      return "some-slug";
    });

    (prismaClient.event.findUnique as jest.Mock).mockImplementationOnce(() => {
      return {
        startTime: new Date("2022-09-18 07:00Z"),
        endTime: new Date("2022-09-21 16:00Z"),
      };
    });

    const request = createRequestWithFormData({
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
      "some-user-id",
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
});
