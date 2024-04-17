export async function createAbuseReportRequest(data: {
  entity: {
    type: "profile" | "organization" | "event" | "project";
    slug: string;
  };
  reporter: {
    email: string;
  };
  reasons: string[];
}) {
  // TODO
  // fetch same origin
  const response = await fetch(process.env.ABUSE_REPORT_URL, {
    method: "POST", // *GET, POST, PUT, DELETE, etc.
    mode: "same-origin", // no-cors, *cors, same-origin
    cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
    headers: {
      "Content-Type": "application/json",
    },
    referrerPolicy: "strict-origin", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    body: JSON.stringify({
      ...data,
      origin: process.env.COMMUNITY_BASE_URL,
    }), // body data type must match "Content-Type" header
  });
  console.log("CALLER RESPONSE JSON", await response.json());
  // on status 200 -> create db entry
  // else -> throw response
}
