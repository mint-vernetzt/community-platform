import { type LoaderFunctionArgs, redirect } from "react-router";
import { getParamValueOrThrow } from "~/lib/utils/routes";

// Default redirect to about page
export const loader = async ({ params }: LoaderFunctionArgs) => {
  const slug = getParamValueOrThrow(params, "slug");
  return redirect(`/organization/${slug}/detail/about`);
};
