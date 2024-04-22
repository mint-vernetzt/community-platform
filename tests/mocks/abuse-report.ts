import { HttpResponse, http, type HttpHandler } from "msw";
import { requireHeader } from "./utils";

const { json } = HttpResponse;

export const handlers: Array<HttpHandler> = [
  http.post(process.env.ABUSE_REPORT_URL, async ({ request }) => {
    console.log("MSW HANDLER FOR ABUSE REPORT TOOL");

    const authHeader = requireHeader(request.headers, "Authorization");
    if (authHeader === null) {
      return json(null, { status: 403 });
    }
    return json(null);
  }),
];
