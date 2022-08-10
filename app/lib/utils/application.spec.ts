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
    expect.assertions(2);
    try {
      await validateFeatureAccess(new Request(""), "a feature");
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(500);

      const json = await response.json();
      expect(json.message).toBe(`No feature flags found`);
    }
  });

  test("feature not found", async () => {
    process.env.FEATURES = "a feature";
    expect.assertions(2);
    try {
      await validateFeatureAccess(new Request(""), "another feature");
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(500);

      const json = await response.json();
      expect(json.message).toBe(`Feature flag for "another feature" not found`);
    }
  });

  test("user has no access", async () => {
    process.env.FEATURES = "a feature, another feature";
    process.env.FEATURE_USER_IDS = "some-user-id";

    (getUserByRequest as jest.Mock).mockImplementationOnce(() => {
      return { id: "some-other-user-id" };
    });

    expect.assertions(2);
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
  });

  test("feature set for specific access", async () => {
    process.env.FEATURES = "a feature, another feature";
    process.env.FEATURE_USER_IDS = "some-user-id, some-other-user-id";

    (getUserByRequest as jest.Mock).mockImplementationOnce(() => {
      return { id: "some-other-user-id" };
    });

    let error;

    try {
      await validateFeatureAccess(new Request(""), "a feature");
    } catch (err) {
      error = err;
    }

    expect(error).toBeUndefined();
  });

  test("feature set for public access", async () => {
    process.env.FEATURES = "a feature, another feature";

    (getUserByRequest as jest.Mock).mockImplementationOnce(() => {
      return { id: "some-user-id" };
    });

    let error;

    try {
      await validateFeatureAccess(new Request(""), "another feature");
    } catch (err) {
      error = err;
    }

    expect(error).toBeUndefined();
  });

  afterAll(() => {
    delete process.env.FEATURES;
    delete process.env.FEATURE_USER_IDS;
  });
});
