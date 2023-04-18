import type * as express from "express";
import { ValidateError } from "tsoa";

// TODO: Create AuthenticationError (or find one in express)
// type AuthenticationError =

export function expressAuthentication(
  request: express.Request,
  securityName: string,
  // @ts-ignore
  scopes?: string[]
  // @ts-ignore
): Promise<any> {
  if (securityName === "api_key") {
    let token;
    if (request.query && request.query.access_token) {
      token = request.query.access_token;
    }

    if (token === "12345678") {
      return Promise.resolve({
        id: 1,
      });
    } else {
      return Promise.reject(
        // TODO: Build AuthenticationError like ValidateError or find one in express
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
}
