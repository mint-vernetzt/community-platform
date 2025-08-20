import { type LoaderFunctionArgs, redirect } from "react-router";
import { viewCookie, viewCookieSchema } from "../organizations.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const url = new URL(args.request.url);

  const cookieHeader = args.request.headers.get("Cookie");
  // TODO: fix type issue
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cookie = (await viewCookie.parse(cookieHeader)) as null | any;
  if (cookie === null) {
    return redirect(`./map?${url.searchParams.toString()}`);
  }
  let view;
  try {
    view = viewCookieSchema.parse(cookie);
  } catch {
    return redirect(`./map?${url.searchParams.toString()}`);
  }
  return redirect(`./${view}?${url.searchParams.toString()}`);
};
