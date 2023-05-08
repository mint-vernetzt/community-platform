import { getUserByToken } from "./apiUser";
describe("API User", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules(); // Most important - it clears the cache
    process.env = { ...OLD_ENV }; // Make a copy
  });

  afterAll(() => {
    process.env = OLD_ENV; // Restore old environment
  });

  test("get user by token", () => {
    process.env.API_KEY = "apiuser:token,apiuser2:token2,apiuser3:token3";
    expect(getUserByToken("token2")).toBe("apiuser2");
  });

  test("expect false when token not found", () => {
    expect(getUserByToken("token")).toBe(false);
  });
});
