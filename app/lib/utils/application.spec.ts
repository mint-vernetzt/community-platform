import { createServerClient } from "@supabase/auth-helpers-remix";
import { getSessionUser } from "~/auth.server";
import { validateFeatureAccess } from "./application";
import { testURL } from "./tests";

// @ts-ignore
const expect = global.expect as jest.Expect;

jest.mock("~/auth.server", () => {
  return { getSessionUser: jest.fn() };
});

const request = new Request(testURL);
const response = new Response();

const authClient = createServerClient("localhost:12345", "SUPABASE_ANON_KEY", {
  request,
  response,
});

describe("validateFeatureAccess()", () => {
  describe("request access for single feature", () => {
    beforeAll(() => {
      delete process.env.FEATURE_FLAGS;
    });

    test("feature flags not set", async () => {
      expect.assertions(6);
      try {
        new Request(testURL);
      } catch (err) {
        console.log({ err });
      }

      // throw
      try {
        await validateFeatureAccess(authClient, "a feature");
      } catch (error) {
        console.log({ error });
        const response = error as Response;
        expect(response.status).toBe(500);

        const json = await response.json();
        expect(json.message).toBe("No feature flags found");
      }

      // self handled
      const { error, hasAccess, abilities } = await validateFeatureAccess(
        authClient,
        "a feature",
        { throw: false }
      );
      if (error !== undefined) {
        expect(error.message).toBe("No feature flags found");
      }
      expect(hasAccess).toBe(false);

      if (abilities["a feature"] !== undefined) {
        if (abilities["a feature"].error !== undefined) {
          expect(abilities["a feature"].error.message).toBe(
            "No feature flags found"
          );
        }
        expect(abilities["a feature"].hasAccess).toBe(false);
      }
    });

    test("feature not found", async () => {
      process.env.FEATURE_FLAGS =
        "a feature: 1798752d-3901-4247-b375-51285141d158; b feature: 4fa83827-a9ba-47d7-947c-5c5b2ede338d";
      expect.assertions(4);

      // throw
      try {
        await validateFeatureAccess(authClient, "another feature");
      } catch (error) {
        const response = error as Response;
        expect(response.status).toBe(500);

        const json = await response.json();
        expect(json.message).toBe(
          `Feature flag for "another feature" not found`
        );
      }

      // self handled
      const { error, hasAccess, featureName } = await validateFeatureAccess(
        authClient,
        "another feature",
        { throw: false }
      );
      if (error !== undefined) {
        expect(error.message).toBe(
          `Feature flag for "${featureName}" not found`
        );
      }
      expect(hasAccess).toBe(false);
    });

    test("user has no feature access", async () => {
      process.env.FEATURE_FLAGS = "another feature: another-user-id";

      expect.assertions(4);

      (getSessionUser as jest.Mock).mockImplementation(() => {
        return { id: "some-other-user-id" };
      });

      // throw
      try {
        await validateFeatureAccess(authClient, "another feature");
      } catch (error) {
        const response = error as Response;
        expect(response.status).toBe(500);

        const json = await response.json();
        expect(json.message).toBe(
          `User hasn't access to feature "another feature"`
        );
      }

      // self handled
      const { error, hasAccess, featureName } = await validateFeatureAccess(
        authClient,
        "another feature",
        { throw: false }
      );
      if (error !== undefined) {
        expect(error.message).toBe(
          `User hasn't access to feature "${featureName}"`
        );
      }
      expect(hasAccess).toBe(false);
    });

    test("user has access to one specific feature", async () => {
      process.env.FEATURE_FLAGS =
        "a feature: some-user-id, some-other-user-id; another feature: second-user-id, some-user-id";

      (getSessionUser as jest.Mock).mockImplementationOnce(() => {
        return { id: "some-other-user-id" };
      });

      let error;
      let hasAccess: boolean | undefined = false;
      let featureName: string | undefined;

      try {
        const result = await validateFeatureAccess(authClient, "a feature");
        error = result.error;
        hasAccess = result.hasAccess;
        featureName = result.featureName;
      } catch (err) {
        error = err;
      }

      expect(error).toBeUndefined();
      expect(hasAccess).toBe(true);
      expect(featureName).toBe("a feature");
    });

    test("feature set for public access (anon)", async () => {
      process.env.FEATURE_FLAGS = "a feature: some-user-id; another feature";

      (getSessionUser as jest.Mock).mockImplementationOnce(() => {
        return null;
      });

      let error;
      let hasAccess: boolean | undefined = false;
      let featureName: string | undefined;

      try {
        const result = await validateFeatureAccess(
          authClient,
          "another feature"
        );
        error = result.error;
        hasAccess = result.hasAccess;
        featureName = result.featureName;
      } catch (err) {
        error = err;
      }

      expect(error).toBeUndefined();
      expect(hasAccess).toBe(true);
      expect(featureName).toBe("another feature");
    });

    test("feature set for public access (logged in user)", async () => {
      process.env.FEATURE_FLAGS = "a feature: some-user-id; another feature";

      (getSessionUser as jest.Mock).mockImplementationOnce(() => {
        return { id: "some-user-id" };
      });

      let error;
      let hasAccess: boolean | undefined = false;
      let featureName: string | undefined;

      try {
        const result = await validateFeatureAccess(
          authClient,
          "another feature"
        );
        error = result.error;
        hasAccess = result.hasAccess;
        featureName = result.featureName;
      } catch (err) {
        error = err;
      }

      expect(error).toBeUndefined();
      expect(hasAccess).toBe(true);
      expect(featureName).toBe("another feature");
    });

    afterAll(() => {
      delete process.env.FEATURE_FLAGS;
    });
  });

  describe("list of features", () => {
    beforeAll(() => {
      delete process.env.FEATURE_FLAGS;
    });

    test("feature flags not set", async () => {
      expect.assertions(6);

      // throw
      try {
        await validateFeatureAccess(authClient, ["feature1", "feature2"]);
      } catch (error) {
        const response = error as Response;
        expect(response.status).toBe(500);

        const json = await response.json();
        expect(json.message).toBe("No feature flags found");
      }

      // self handled
      const { abilities } = await validateFeatureAccess(
        authClient,
        ["feature1", "feature2"],
        { throw: false }
      );

      if (abilities["feature1"].error !== undefined) {
        expect(abilities["feature1"].error.message).toBe(
          "No feature flags found"
        );
      }
      expect(abilities["feature1"].hasAccess).toBe(false);

      if (abilities["feature2"].error !== undefined) {
        expect(abilities["feature2"].error.message).toBe(
          "No feature flags found"
        );
      }
      expect(abilities["feature2"].hasAccess).toBe(false);
    });

    test("feature not found", async () => {
      process.env.FEATURE_FLAGS =
        "feature1: some-user-id, another-user-id; feature3:";

      //expect.assertions(4);

      (getSessionUser as jest.Mock).mockImplementationOnce(() => {
        return { id: "some-user-id" };
      });

      // throw
      try {
        await validateFeatureAccess(authClient, ["feature1", "feature2"]);
      } catch (error) {
        const response = error as Response;
        expect(response.status).toBe(500);

        const json = await response.json();
        expect(json.message).toBe(`Feature flag for "feature2" not found`);
      }

      (getSessionUser as jest.Mock).mockImplementationOnce(() => {
        return { id: "some-user-id" };
      });

      // self handled
      const { abilities } = await validateFeatureAccess(
        authClient,
        ["feature1", "feature2"],
        { throw: false }
      );

      if (abilities["feature2"].error !== undefined) {
        expect(abilities["feature2"].error.message).toBe(
          `Feature flag for "feature2" not found`
        );
      }
      expect(abilities["feature2"].hasAccess).toBe(false);
    });

    test("user has no access", async () => {
      process.env.FEATURE_FLAGS =
        "feature1: some-user-id, second-user-id; feature2: another-user-id";

      expect.assertions(6);

      (getSessionUser as jest.Mock).mockImplementation(() => {
        return { id: "some-other-user-id" };
      });

      // throw
      try {
        await validateFeatureAccess(authClient, ["feature1", "feature2"]);
      } catch (error) {
        const response = error as Response;
        expect(response.status).toBe(500);

        const json = await response.json();
        expect(json.message).toBe(`User hasn't access to feature "feature1"`);
      }

      // self handled
      const { abilities } = await validateFeatureAccess(
        authClient,
        ["feature1", "feature2"],
        { throw: false }
      );

      if (abilities["feature1"].error !== undefined) {
        expect(abilities["feature1"].error.message).toBe(
          `User hasn't access to feature "feature1"`
        );
      }
      expect(abilities["feature1"].hasAccess).toBe(false);

      if (abilities["feature2"].error !== undefined) {
        expect(abilities["feature2"].error.message).toBe(
          `User hasn't access to feature "feature2"`
        );
      }
      expect(abilities["feature2"].hasAccess).toBe(false);
    });

    test("user has access to one of two requested features", async () => {
      process.env.FEATURE_FLAGS =
        "a feature: some-user-id, second-user-id; another feature: some-other-user-id, some-user-id";

      (getSessionUser as jest.Mock).mockImplementationOnce(() => {
        return { id: "some-other-user-id" };
      });

      // throw
      try {
        await validateFeatureAccess(authClient, [
          "a feature",
          "another feature",
        ]);
      } catch (error) {
        const response = error as Response;
        expect(response.status).toBe(500);

        const json = await response.json();
        // prettier-ignore
        expect(json.message).toBe("User hasn't access to feature \"a feature\"");
      }

      (getSessionUser as jest.Mock).mockImplementationOnce(() => {
        return { id: "some-other-user-id" };
      });

      // self handled
      const { abilities } = await validateFeatureAccess(
        authClient,
        ["a feature", "another feature"],
        { throw: false }
      );

      expect(abilities["a feature"].hasAccess).toBe(false);
      expect(abilities["a feature"].error?.message).toBe(
        // prettier-ignore
        "User hasn't access to feature \"a feature\""
      );
      expect(abilities["another feature"].hasAccess).toBe(true);
      expect(abilities["another feature"].error).toBe(undefined);
    });
    test("feature set for public access", async () => {
      process.env.FEATURE_FLAGS = "feature1;feature2;feature3";

      (getSessionUser as jest.Mock).mockImplementationOnce(() => {
        return { id: "some-other-user-id" };
      });

      expect.assertions(4);

      const { abilities } = await validateFeatureAccess(authClient, [
        "feature1",
        "feature2",
      ]);

      if (abilities["feature1"] !== undefined) {
        expect(abilities["feature1"].hasAccess).toBe(true);
        expect(abilities["feature1"].error).toBeUndefined();
      }

      if (abilities["feature2"] !== undefined) {
        expect(abilities["feature2"].hasAccess).toBe(true);
        expect(abilities["feature2"].error).toBeUndefined();
      }
    });

    afterAll(() => {
      delete process.env.FEATURE_FLAGS;
    });
  });
});
