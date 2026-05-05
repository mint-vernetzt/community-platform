import { redirect, type LoaderFunctionArgs } from "react-router";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
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
  const { slug } = params;

  invariantResponse(typeof slug === "string", "Invalid slug", { status: 400 });

  const { authClient } = createAuthClient(request);

  await checkFeatureAbilitiesOrThrow(authClient, [
    "events",
    "next_event_settings",
  ]);
  const sessionUser = await getSessionUserOrThrow(authClient);
  const redirectPath = await getRedirectPathOnProtectedEventRoute({
    request,
    slug,
    sessionUser,
    authClient,
  });
  if (redirectPath !== null) {
    return redirect(redirectPath);
  }

  const eventName = await getEventNameBySlug(slug);
  invariantResponse(eventName !== null, "Event not found", { status: 404 });

  const participants = await getParticipantsOfEvent(slug);
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
