import type * as express from "express";

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
      return Promise.resolve(request.body);
    } else {
      return Promise.reject({});
    }
  }
}
