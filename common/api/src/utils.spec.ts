import { getBaseURL } from "./utils";

const testURL = "http://localhost:3000";

describe("getBaseURL", () => {
  test("given base url is undefined", () => {
    const baseURL = getBaseURL();
    expect(baseURL).toBeUndefined();
  });
  test("given base url has trailing slash", () => {
    const baseURL = getBaseURL(`${testURL}/`);
    expect(baseURL).toBe(testURL);
  });
  test("given base url has no trailing slash", () => {
    const baseURL = getBaseURL(testURL);
    expect(baseURL).toBe(testURL);
  });
});
