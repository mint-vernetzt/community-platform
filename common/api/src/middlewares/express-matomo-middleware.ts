import type { NextFunction, Request, Response } from "express";
import PiwikTracker from "piwik-tracker";
import { getUserByToken } from "../lib/apiUser";
import { getApiTokenFromRequest } from "../lib/token";
import { trackingRoutes } from "../lib/trackingRoutes";
/**
 * https://stackoverflow.com/questions/10849687/express-js-how-to-get-remote-client-address
 * @todo:
 * - ip address is missing/empty
 * [x] getUserByToken
 * [x] getTokenFromRequest
 * - addUserToAllUrls
 * -
 * API_USERS="<slug>:<token>,<slug>:<token>"
 */

export type Options = {
  siteId: number;
  baseUrl: string;
  piwikUrl: string;
  piwikToken: string;
};

function matomoMiddleware(options: Options) {
  var piwik = new PiwikTracker(options.siteId, options.piwikUrl);

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
        piwik.track({
          url: options.baseUrl + `/${apiUser}/${apiMatch[0]}/`,
          action_name: "API Access",
          ua: request.header("User-Agent"),
          lang: request.header("Accept-Language"),
          cvar: JSON.stringify({
            "1": ["API version", "v1"],
            "2": ["HTTP method", request.method],
          }),
          token_auth: options.piwikToken,
          cip: request.ip,
        });
      }
    }

    next();
  };
}

export default matomoMiddleware;
