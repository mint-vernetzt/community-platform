import { getUserByRequest } from "~/auth.server";
import { validateFeatureAccess } from "./application";

// @ts-ignore
const expect = global.expect as jest.Expect;

jest.mock("~/auth.server", () => {
  return { getUserByRequest: jest.fn() };
});

describe("validateFeatureAccess()", () => {
  beforeAll(() => {
    delete process.env.FEATURES;
    delete process.env.FEATURE_USER_IDS;
  });

  test("feature flags not set", async () => {
    expect.assertions(4);

    // throw
    try {
      await validateFeatureAccess(new Request(""), "a feature");
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(500);

      const json = await response.json();
      expect(json.message).toBe("No feature flags found");
    }

    // self handled
    const { error, hasAccess } = await validateFeatureAccess(
      new Request(""),
      "a feature",
      { throw: false }
    );
    if (error !== undefined) {
      expect(error.message).toBe("No feature flags found");
    }
    expect(hasAccess).toBe(false);
  });

  test("feature not found", async () => {
    process.env.FEATURES = "a feature";
    expect.assertions(4);

    // throw
    try {
      await validateFeatureAccess(new Request(""), "another feature");
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(500);

      const json = await response.json();
      expect(json.message).toBe(`Feature flag for "another feature" not found`);
    }

    // self handled
    const { error, hasAccess, featureName } = await validateFeatureAccess(
      new Request(""),
      "another feature",
      { throw: false }
    );
    if (error !== undefined) {
      expect(error.message).toBe(`Feature flag for "${featureName}" not found`);
    }
    expect(hasAccess).toBe(false);
  });

  test("user has no access", async () => {
    process.env.FEATURES = "a feature, another feature";
    process.env.FEATURE_USER_IDS = "some-user-id";

    expect.assertions(4);

    (getUserByRequest as jest.Mock).mockImplementation(() => {
      return { id: "some-other-user-id" };
    });

    // throw
    try {
      await validateFeatureAccess(new Request(""), "another feature");
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
      new Request(""),
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

  test("feature set for specific access", async () => {
    process.env.FEATURES = "a feature, another feature";
    process.env.FEATURE_USER_IDS = "some-user-id, some-other-user-id";

    (getUserByRequest as jest.Mock).mockImplementationOnce(() => {
      return { id: "some-other-user-id" };
    });

    let error;
    let hasAccess: boolean | undefined = false;
    let featureName: string | undefined;

    try {
      const result = await validateFeatureAccess(new Request(""), "a feature");
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

  test("feature set for public access", async () => {
    process.env.FEATURES = "a feature, another feature";

    (getUserByRequest as jest.Mock).mockImplementationOnce(() => {
      return { id: "some-user-id" };
    });

    let error;
    let hasAccess: boolean | undefined = false;
    let featureName: string | undefined;

    try {
      const result = await validateFeatureAccess(
        new Request(""),
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

  describe("list of features", () => {
    test("feature not found", async () => {
      process.env.FEATURES = "feature1, feature3";

      expect.assertions(4);

      // throw
      try {
        await validateFeatureAccess(new Request(""), ["feature1", "feature2"]);
      } catch (error) {
        const response = error as Response;
        expect(response.status).toBe(500);

        const json = await response.json();
        expect(json.message).toBe(`Feature flag for "feature2" not found`);
      }

      // self handled
      const { abilities } = await validateFeatureAccess(
        new Request(""),
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
      process.env.FEATURES = "feature1, feature2";
      process.env.FEATURE_USER_IDS = "some-user-id";

      expect.assertions(6);

      (getUserByRequest as jest.Mock).mockImplementation(() => {
        return { id: "some-other-user-id" };
      });

      // throw
      try {
        await validateFeatureAccess(new Request(""), ["feature1", "feature2"]);
      } catch (error) {
        const response = error as Response;
        expect(response.status).toBe(500);

        const json = await response.json();
        expect(json.message).toBe(`User hasn't access to feature "feature1"`);
      }

      // self handled
      const { abilities } = await validateFeatureAccess(
        new Request(""),
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

    test("feature set for specific access", async () => {
      process.env.FEATURES = "feature1, feature2";
      process.env.FEATURE_USER_IDS = "some-user-id, some-other-user-id";

      (getUserByRequest as jest.Mock).mockImplementationOnce(() => {
        return { id: "some-other-user-id" };
      });

      expect.assertions(4);

      const { abilities } = await validateFeatureAccess(new Request(""), [
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
  });

  afterAll(() => {
    delete process.env.FEATURES;
    delete process.env.FEATURE_USER_IDS;
  });
});
