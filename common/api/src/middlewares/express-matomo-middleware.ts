import type { NextFunction, Request, Response } from "express";
import { getUserByToken } from "../lib/apiUser";
import { getApiTokenFromRequest } from "../lib/token";
import { trackingRoutes } from "../lib/trackingRoutes";
import MatomoTracker from "matomo-tracker";

export type Options = {
  siteId: number;
  baseUrl: string;
  matomoUrl: string;
  matomoToken: string;
};

function matomoMiddleware(options: Options) {
  const matomo = new MatomoTracker(options.siteId, options.matomoUrl, false);

  return function track(
    request: Request,
    _response: Response,
    next: NextFunction
  ) {
    const apiMatch = trackingRoutes.filter((apiEndpoint) =>
      request.url.startsWith(`/${apiEndpoint}`)
    );

    if (apiMatch.length === 1) {
      const apiUser = getUserByToken(getApiTokenFromRequest(request) || "");
      if (apiUser !== false) {
        matomo.track({
          url: options.baseUrl + `/${apiUser}/${apiMatch[0]}/`,
          action_name: "API Access",
          ua: request.header("User-Agent"),
          lang: request.header("Accept-Language"),
          cvar: JSON.stringify({
            "1": ["API version", "v1"],
            "2": ["HTTP method", request.method],
          }),
          token_auth: options.matomoToken,
          cip:
            ((request.headers["x-forwarded-for"] as string) ||
              request.socket.remoteAddress) ??
            "",
        });
      }
    }

    next();
  };
}

export default matomoMiddleware;
