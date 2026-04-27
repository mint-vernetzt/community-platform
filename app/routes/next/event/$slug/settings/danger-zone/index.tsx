import { type LoaderFunctionArgs, redirect } from "react-router";
import { Deep } from "~/lib/utils/searchParams";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;

  const searchParams = new URL(request.url).searchParams;
  const deep = searchParams.get("deep");

  return redirect(deep === null ? "./change-url" : `./change-url?${Deep}=true`);
};
