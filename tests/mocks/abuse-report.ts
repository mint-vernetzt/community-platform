import { HttpResponse, http, type HttpHandler } from "msw";
import { abuseReportTestUrl } from "~/lib/utils/tests";

const { json } = HttpResponse;

export const handlers: Array<HttpHandler> = [
  http.post(abuseReportTestUrl, async ({ request }) => {
    // TODO: Enable next line when auth header is implemented
    // const authHeader = requireHeader(request.headers, "Authorization");
    // if (authHeader === null) {
    //   return json(null, { status: 403 });
    // }
    return json(null);
  }),
];
