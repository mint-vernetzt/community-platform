import { redirect, type LoaderFunctionArgs } from "react-router";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { getRedirectPathOnProtectedEventRoute } from "../../settings.server";
import {
  createCsvString,
  getEventNameBySlug,
  getParticipantsOfEvent,
} from "./list-download.server";
import { escapeFilenameSpecialChars } from "~/lib/string/escapeFilenameSpecialChars";

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;

  invariantResponse(typeof params.slug === "string", "slug is not defined", {
    status: 400,
  });
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);
  const redirectPath = await getRedirectPathOnProtectedEventRoute({
    request,
    slug: params.slug,
    sessionUser,
    authClient,
  });
  if (redirectPath !== null) {
    return redirect(redirectPath);
  }
  invariantResponse(sessionUser, "User not authenticated", { status: 401 });
  await checkFeatureAbilitiesOrThrow(authClient, ["events"]);

  const eventName = await getEventNameBySlug(params.slug);
  invariantResponse(eventName !== null, "Event not found", { status: 404 });

  const participants = await getParticipantsOfEvent(params.slug);
  const csv = createCsvString(participants);
  const date = new Date().toLocaleDateString("en-EN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const filename = `${date}_participants_${eventName}.csv`;

  const escapedFilename = escapeFilenameSpecialChars(filename);

  return new Response(`\uFEFF${csv}`, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `filename="${escapedFilename}"`,
    },
  });
}
