import { type ActionFunctionArgs } from "react-router";
import * as Sentry from "@sentry/node";

export const action = async (args: ActionFunctionArgs) => {
  const { request } = args;
  const body = await request.json();
  console.error("CSP Report: ", body);
  Sentry.captureException(String(body));
  return null;
};
