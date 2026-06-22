import { type LoaderFunctionArgs, redirect } from "react-router";
import { Deep } from "~/lib/utils/searchParams";

export async function loader(args: LoaderFunctionArgs) {
  const { request } = args;

  const searchParams = new URL(request.url).searchParams;
  const deep = searchParams.get("deep");

  return redirect(deep === null ? "./access" : `./access?${Deep}=true`);
}
