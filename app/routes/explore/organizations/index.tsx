import { redirect, type LoaderFunctionArgs } from "react-router";
import { viewCookie, viewCookieSchema } from "../organizations.server";

export async function loader(args: LoaderFunctionArgs) {
  const { request } = args;
  const url = new URL(request.url);
  const cookieHeader = request.headers.get("Cookie");
  // TODO: fix type issue
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cookie = (await viewCookie.parse(cookieHeader)) as null | any;
  if (cookie === null) {
    return redirect(`./list?${url.searchParams.toString()}`);
  }
  let view;
  try {
    view = viewCookieSchema.parse(cookie);
  } catch {
    return redirect(`./list?${url.searchParams.toString()}`);
  }
  return redirect(`./${view}?${url.searchParams.toString()}`);
}
