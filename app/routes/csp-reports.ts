import { type ActionFunctionArgs } from "react-router";
import { invariantResponse } from "~/lib/utils/response";

export const action = async (args: ActionFunctionArgs) => {
  const { request } = args;
  const contentType = request.headers.get("content-type");
  invariantResponse(
    contentType === "application/reports+json",
    "Invalid content type",
    { status: 400 }
  );
  const body = await request.json();
  invariantResponse(body instanceof Report, "Invalid body", { status: 400 });
  invariantResponse(body.type === "csp-violation", "Invalid report type", {
    status: 400,
  });

  // TODO: Handle the CSP report
  console.error(body);

  return null;
};
