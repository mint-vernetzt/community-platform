import { type LoaderFunctionArgs, redirect } from "react-router";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;

  const searchParams = new URL(request.url).searchParams;
  const deep = searchParams.get("deep");

  return redirect(`./change-url?deep=${deep}`);
};
