import { type LoaderFunctionArgs, redirect } from "react-router";
import { invariantResponse } from "~/lib/utils/response";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const slug = params.slug;
  invariantResponse(typeof slug === "string", "Slug is required", {
    status: 400,
  });
  return redirect(`/event/${slug}/detail`);
};
