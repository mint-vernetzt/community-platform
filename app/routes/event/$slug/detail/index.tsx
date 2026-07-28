import { type LoaderFunctionArgs, redirect } from "react-router";

export async function loader(args: LoaderFunctionArgs) {
  const { request } = args;

  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");

  if (tokenHash === null) {
    return redirect("./about");
  }

  return redirect(`./about?token_hash=${tokenHash}`);
}
