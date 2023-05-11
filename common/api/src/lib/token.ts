import type { Request } from "express";

function getApiTokenFromRequest(request: Request) {
  return (request?.query?.access_token as string) ?? "";
}

export { getApiTokenFromRequest };
