import { validateFeatureAccess } from "./application";

// @ts-ignore
const expect = global.expect as jest.Expect;

describe("validateFeatureAccess()", () => {
  beforeAll(() => {
    process.env.FEATURES = "feature1,feature2";
  });
  test("feature not set", () => {
    expect.assertions(1);
    try {
      validateFeatureAccess("a feature");
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(404);
    }
  });
  test("user id not set", () => {
    expect.assertions(1);
    try {
      validateFeatureAccess("a feature");
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(404);
    }
  });
  test("user id not set", () => {
    expect.assertions(2);
    try {
      validateFeatureAccess("a feature");
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(404);
    }

    process.env.FEATURE_USER_IDS = "some-user-id";
    try {
      validateFeatureAccess("feature1");
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(404);
    }
  });
  test("user id not set", () => {
    process.env.FEATURE_USER_IDS = "some-user-id";
    try {
      validateFeatureAccess("feature1");
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(404);
    }
  });
  test("feature set for specific access", () => {
    process.env.FEATURE_USER_IDS = "some-user-id";
    expect(validateFeatureAccess("feature1")).toBe(true);
    process.env.FEATURE_USER_IDS = undefined;
  });
  test("feature set for public access", () => {
    expect(validateFeatureAccess("feature2")).toBe(true);
  });
  afterAll(() => {
    process.env.FEATURES = undefined;
  });
});
