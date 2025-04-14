import { type ActionFunctionArgs } from "react-router";
import { invariantResponse } from "~/lib/utils/response";

export const action = async (args: ActionFunctionArgs) => {
  const { request } = args;
  const contentType = request.headers.get("content-type");
  invariantResponse(
    contentType === "application/csp-report",
    "Invalid content type",
    { status: 400 }
  );
  const body = await request.json();
  // TODO: Handle the CSP report
  console.error(body);

  return null;
};
