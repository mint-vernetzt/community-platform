import { decorate } from "./matomoUrlDecorator";
import type { Request } from "express";

describe("Matomo Url Decorator", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules(); // Most important - it clears the cache
    process.env = { ...OLD_ENV }; // Make a copy
  });

  afterAll(() => {
    process.env = OLD_ENV; // Restore old environment
  });

  process.env.API_KEY = "apiuser:token,apiuser2:token2,apiuser3:token3";

  const mockRequest = {
    query: {
      access_token: "token",
    },
  } as Partial<Request>;

  test("decorate without prevoiusly existing search params", () => {
    const newUrl = decorate(
      mockRequest as Request,
      "https://domain.tld/endpoint"
    );
    expect(newUrl).toBe("https://domain.tld/endpoint?mtm_source=apiuser");
  });

  test("decorate with prevoiusly existing search params", () => {
    const newUrl = decorate(
      mockRequest as Request,
      "https://domain.tld/?previous=true"
    );
    expect(newUrl).toBe("https://domain.tld/?previous=true&mtm_source=apiuser");
  });
});
