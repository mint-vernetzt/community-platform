import { HttpResponse, http, type HttpHandler } from "msw";
import { abuseReportTestUrl } from "~/lib/utils/tests";
import { requireHeader } from "./utils";

const { json } = HttpResponse;

export const handlers: Array<HttpHandler> = [
  http.post(abuseReportTestUrl, async ({ request }) => {
    const authHeader = requireHeader(request.headers, "Authorization");
    if (authHeader === null) {
      return json(null, { status: 403 });
    }
    return json(null);
  }),
];
