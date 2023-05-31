import { getApiTokenFromRequest } from "./token";
import type { Request } from "express";

describe("Token from request", () => {
  test("get a token from request", () => {
    const mockRequest = {
      query: {
        access_token: "TOKEN",
      },
    } as Partial<Request>;

    expect(getApiTokenFromRequest(mockRequest as Request)).toBe("TOKEN");
  });
});
