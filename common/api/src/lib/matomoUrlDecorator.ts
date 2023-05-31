import type { Request } from "express";
import { getApiTokenFromRequest } from "./token";
import { getUserByToken } from "./apiUser";

export function decorate(request: Request, url: string) {
  const token = getApiTokenFromRequest(request);
  const apiUser = getUserByToken(token) ?? "";

  if (apiUser !== false) {
    const newUrl = new URL(url);
    newUrl.searchParams.append("mtm_source", apiUser);

    return newUrl.href;
  }

  return url;
}
