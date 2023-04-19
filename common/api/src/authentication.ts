import type * as express from "express";
import { ValidateError } from "tsoa";

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
    if (token === process.env.API_KEY) {
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
  }
}
