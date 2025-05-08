import { type Request } from "express";
import { ValidateError } from "tsoa";
import { getApiTokenFromRequest } from "./lib/token";
import { getUserByToken } from "./lib/apiUser";

export function expressAuthentication(request: Request, securityName: string) {
  if (securityName === "api_key") {
    const token = getApiTokenFromRequest(request);

    if (typeof token === "string" && getUserByToken(token)) {
      return Promise.resolve();
    } else {
      return Promise.reject(
        new ValidateError(
          {
            access_token: {
              message: "Invalid access token",
            },
          },
          "Authentication failed"
        )
      );
    }
  } else {
    return Promise.reject(
      new ValidateError(
        {
          access_token: {
            message: "Invalid access token",
          },
        },
        "Authentication failed"
      )
    );
  }
}
