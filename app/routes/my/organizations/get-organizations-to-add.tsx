import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "react-router-dom";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { getOrganizationsToAdd } from "./get-organizations-to-add.server";

export const GetOrganizationsToAdd: {
  SearchParam: "add-organization";
} = { SearchParam: "add-organization" };

export async function loader(args: LoaderFunctionArgs) {
  const { request } = args;
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);

  if (sessionUser === null) {
    return json([]);
  }

  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const query = searchParams.get(GetOrganizationsToAdd.SearchParam);

  const noJS = searchParams.get("no-js");
  if (noJS !== null) {
    const url = new URL(request.headers.get("Referer") || "/");
    if (typeof query === "string" && query !== "") {
      url.searchParams.set("add-organization", query || "");
    }
    return redirect(`${url.pathname}?${url.searchParams.toString()}`);
  }

  const organizations = await getOrganizationsToAdd(request, sessionUser);
  return json(organizations);
}
