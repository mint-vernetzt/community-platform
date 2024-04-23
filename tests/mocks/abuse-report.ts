import { HttpResponse, http, type HttpHandler } from "msw";
import { z } from "zod";
import { requireHeader } from "./utils";
import { abuseReportTestUrl } from "~/lib/utils/tests";

const { json } = HttpResponse;

const abuseReportSchema = z.object({
  report: z.object({
    entity: z.object({
      type: z.enum(["profile", "organization", "event", "project"]),
      slug: z.string(),
    }),
    reporter: z.object({
      email: z.string().email(),
    }),
    reasons: z.string().array(),
  }),
  origin: z.string().url(),
});

export const handlers: Array<HttpHandler> = [
  http.post(abuseReportTestUrl, async ({ request }) => {
    const authHeader = requireHeader(request.headers, "Authorization");
    if (authHeader === null) {
      return json(null, { status: 403 });
    }
    const body = await request.json();
    let abuseReport;
    try {
      abuseReport = abuseReportSchema.parse(body);
    } catch (error: unknown) {
      return json({ message: "Bad request" }, { status: 400 });
    }
    if (abuseReport.origin !== process.env.COMMUNITY_BASE_URL) {
      return json({ message: "Bad request" }, { status: 400 });
    }
    return json({ message: "Report successfully submitted" });
  }),
];
