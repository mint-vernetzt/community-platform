import { type LoaderFunctionArgs } from "react-router";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { escapeFilenameSpecialChars } from "~/lib/string/escapeFilenameSpecialChars";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { deriveEventMode } from "../utils.server";
import { createIcsString, getEventBySlug } from "./ics-download.server";
import {
  getIsParticipant,
  getIsSpeaker,
  getIsTeamMember,
} from "./utils.server";

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;
  const { authClient } = createAuthClient(request);

  const sessionUser = await getSessionUser(authClient);

  const slug = getParamValueOrThrow(params, "slug");
  const event = await getEventBySlug(slug);
  invariantResponse(event, "Event not found", { status: 404 });
  const mode = await deriveEventMode(sessionUser, slug);

  const isTeamMember = await getIsTeamMember(event.id, sessionUser?.id);
  const isSpeaker = await getIsSpeaker(event.id, sessionUser?.id);
  const isParticipant = await getIsParticipant(event.id, sessionUser?.id);

  const isMember =
    isTeamMember || isSpeaker || isParticipant || mode === "admin";

  if (event.openForRegistration === false || event.published === false) {
    invariantResponse(isMember, "Forbidden", { status: 403 });
  }

  const url = new URL(request.url);
  const absoluteEventURL =
    url.protocol + "//" + url.host + `/event/${event.slug}/detail/about`;
  const ics = createIcsString(event, absoluteEventURL, isMember);
  const filename = escapeFilenameSpecialChars(event.name + ".ics");

  // TODO: Check for missing headers
  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar",
      "Content-Disposition": `filename="${filename}"`,
    },
  });
}
