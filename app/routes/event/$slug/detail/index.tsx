import { type LoaderFunctionArgs, redirect } from "react-router";
import { PARTICIPATION_TOKEN_HASH_SEARCH_PARAM } from "~/events.shared";

export async function loader(args: LoaderFunctionArgs) {
  const { request } = args;

  const url = new URL(request.url);
  const tokenHash = url.searchParams.get(PARTICIPATION_TOKEN_HASH_SEARCH_PARAM);

  if (tokenHash === null) {
    return redirect("./about");
  }

  return redirect(
    `./about?${PARTICIPATION_TOKEN_HASH_SEARCH_PARAM}=${tokenHash}`
  );
}
