import type { User } from "@supabase/supabase-js";
import * as authServerModule from "~/auth.server";
import { prismaClient } from "~/prisma";
import { testURL } from "~/lib/utils/tests";
import { loader } from "./events";

// @ts-ignore
const expect = global.expect as jest.Expect;

const getUserByRequest = jest.spyOn(authServerModule, "getUserByRequest");

const slug = "slug-test";

jest.mock("~/prisma", () => {
  return {
    prismaClient: {
      event: {
        findFirst: jest.fn(),
      },
      teamMemberOfEvent: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
    },
  };
});

describe("/event/$slug/settings/events", () => {
  describe("loader (privileged user)", () => {
    beforeAll(() => {
      process.env.FEATURES = "events";
    });

    test("no other events where user is privileged", async () => {
      expect.assertions(1);

      getUserByRequest.mockResolvedValue({ id: "some-user-id" } as User);
      (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
        return { slug, parentEvent: null };
      });
      (
        prismaClient.teamMemberOfEvent.findFirst as jest.Mock
      ).mockImplementationOnce(() => {
        return { isPrivileged: true };
      });
      (
        prismaClient.teamMemberOfEvent.findMany as jest.Mock
      ).mockImplementationOnce(() => {
        return [];
      });

      try {
        const response = await loader({
          request: new Request(testURL),
          context: {},
          params: { slug },
        });
        expect(response.options).toEqual([]);
      } catch (error) {
        const response = error as Response;
        console.log(response);
        const json = await response.json();
        console.log(json);
      }
    });

    test("user is privileged on other events", async () => {
      expect.assertions(1);

      getUserByRequest.mockResolvedValue({ id: "some-user-id" } as User);
      (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
        return { slug, parentEvent: null };
      });
      (
        prismaClient.teamMemberOfEvent.findFirst as jest.Mock
      ).mockImplementationOnce(() => {
        return { isPrivileged: true };
      });
      (
        prismaClient.teamMemberOfEvent.findMany as jest.Mock
      ).mockImplementationOnce(() => {
        return [
          {
            event: {
              id: "another-event-id",
              name: "Another Event",
              parentEventId: "a-parent-event-id",
            },
          },
          {
            event: {
              id: "yet-another-event-id",
              name: "Yet Another Event",
              parentEventId: null,
            },
          },
        ];
      });

      try {
        const response = await loader({
          request: new Request(testURL),
          context: {},
          params: { slug },
        });
        expect(response.options).toEqual([
          {
            label: "Another Event",
            value: "another-event-id",
            hasParent: true,
          },
          {
            label: "Yet Another Event",
            value: "yet-another-event-id",
            hasParent: false,
          },
        ]);
      } catch (error) {
        const response = error as Response;
        console.log(response);
        const json = await response.json();
        console.log(json);
      }
    });

    test("event has still parent event", async () => {
      expect.assertions(2);

      getUserByRequest.mockResolvedValue({ id: "some-user-id" } as User);
      (prismaClient.event.findFirst as jest.Mock).mockImplementationOnce(() => {
        return {
          slug,
          parentEvent: { id: "parent-event-id", name: "Parent Event" },
        };
      });
      (
        prismaClient.teamMemberOfEvent.findFirst as jest.Mock
      ).mockImplementationOnce(() => {
        return { isPrivileged: true };
      });
      (
        prismaClient.teamMemberOfEvent.findMany as jest.Mock
      ).mockImplementationOnce(() => {
        return [];
      });

      try {
        const response = await loader({
          request: new Request(testURL),
          context: {},
          params: { slug },
        });
        expect(response.parentEventId).toBe("parent-event-id");
        expect(response.parentEventName).toBe("Parent Event");
      } catch (error) {
        const response = error as Response;
        console.log(response);
        const json = await response.json();
        console.log(json);
      }
    });

    afterAll(() => {
      delete process.env.FEATURES;
    });
  });
});
