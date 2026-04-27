import { captureException } from "@sentry/node";
import { type ActionFunctionArgs } from "react-router";

export async function action(args: ActionFunctionArgs) {
  const { request } = args;
  const body = await request.json();
  console.error("CSP Report: ", body);
  captureException(String(body));
  return null;
}
