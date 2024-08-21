import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
} from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { deriveProfileMode } from "~/routes/profile/$username/utils.server";
import {
  addImageUrlToOrganizations,
  getOrganizationsFromProfile,
} from "./organizations.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const username = getParamValueOrThrow(params, "username");
  const { authClient } = createAuthClient(request);
  const { sessionUser, redirectPath } =
    await getSessionUserOrRedirectPathToLogin(authClient, request);
  if (sessionUser === null && redirectPath !== null) {
    return redirect(redirectPath);
  }
  const mode = await deriveProfileMode(sessionUser, username);
  invariantResponse(mode === "owner", "Forbidden", { status: 403 });

  const result = await getOrganizationsFromProfile(username);
  const { adminOrganizations, teamMemberOrganizations } =
    addImageUrlToOrganizations(authClient, result);

  return json({ adminOrganizations, teamMemberOrganizations });
};
