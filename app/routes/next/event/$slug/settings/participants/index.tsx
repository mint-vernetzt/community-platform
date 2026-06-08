import { type LoaderFunctionArgs, redirect } from "react-router";
import { invariantResponse } from "~/lib/utils/response";
import { Deep } from "~/lib/utils/searchParams";
import { getEventBySlug } from "./index.server";

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;
  const { slug } = params;
  invariantResponse(typeof slug === "string", "slug is not defined", {
    status: 400,
  });
  const event = await getEventBySlug(slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });

  const searchParams = new URL(request.url).searchParams;
  const deep = searchParams.get("deep");

  if (event.published === false || event.external) {
    return redirect(`../../time-period?${Deep}=${deep}`);
  }

  return redirect(deep === null ? "./list" : `./list?${Deep}=true`);
}
