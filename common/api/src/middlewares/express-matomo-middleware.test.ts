import type { NextFunction, Request } from "express";
import matomoMiddleware from "./express-matomo-middleware";

describe("Matomo Tracking Middleware", () => {
  let mockRequest: Partial<Request>;
  let nextFunction: NextFunction = jest.fn();

  beforeEach(() => {
    mockRequest = {};
  });

  test.skip("next is called once", () => {
    matomoMiddleware({
      siteId: 1,
      baseUrl: "baseUrl",
      piwikUrl: "piwik.php",
      piwikToken: "piwikToken",
    });

    expect(nextFunction).toBeCalledTimes(1);
  });
});
