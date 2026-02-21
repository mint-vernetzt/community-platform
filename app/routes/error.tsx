import { captureException } from "@sentry/node";
import { type ActionFunctionArgs, redirect } from "react-router";

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const error = formData.get("error");
  if (typeof error === "string") {
    captureException(error);
  }
  return redirect("/");
};
