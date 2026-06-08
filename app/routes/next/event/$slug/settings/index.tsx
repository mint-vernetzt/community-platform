import { type LoaderFunctionArgs, redirect } from "react-router";
import { invariantResponse } from "~/lib/utils/response";
import { getEventBySlug } from "./index.server";
import { Deep } from "~/lib/utils/searchParams";

export const loader = async (args: LoaderFunctionArgs) => {
  const { params } = args;
  const { slug } = params;
  invariantResponse(typeof slug === "string", "slug is not defined", {
    status: 400,
  });
  const event = await getEventBySlug(slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });

  if (event.published && event.external === false) {
    return redirect(`./participants?${Deep}=false`);
  }

  return redirect(`./time-period?${Deep}=false`);
};
