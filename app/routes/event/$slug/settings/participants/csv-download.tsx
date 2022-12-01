import { createServerClient } from "@supabase/auth-helpers-remix";
import { LoaderFunction } from "@remix-run/node";
import { badRequest, notFound } from "remix-utils";
import { getSessionUserOrThrow } from "~/auth.server";
import { escapeFilenameSpecialChars } from "~/lib/string/escapeFilenameSpecialChars";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import {
  getEventBySlugOrThrow,
  getFullDepthParticipants,
  getFullDepthWaitingList,
} from "../../utils.server";
import { checkOwnershipOrThrow } from "../utils.server";

async function getProfilesBySearchParams(
  event: Awaited<ReturnType<typeof getEventBySlugOrThrow>>,
  depth: string | null,
  type: string | null
) {
  let profiles;

  if (type === "participants") {
    if (depth === "full") {
      profiles = await getFullDepthParticipants(event.id, false);
    } else if (depth === "single") {
      profiles = event.participants.map((participant) => {
        return { ...participant.profile, eventName: event.name };
      });
    } else {
      throw badRequest({
        message:
          "search parameter - depth = full || single - must be provided.",
      });
    }
  } else if (type === "waitingList") {
    if (depth === "full") {
      profiles = await getFullDepthWaitingList(event.id, false);
    } else if (depth === "single") {
      profiles = event.waitingList.map((waitingParticipant) => {
        return { ...waitingParticipant.profile, eventName: event.name };
      });
    } else {
      throw badRequest({
        message:
          "search parameter - depth = full || single - must be provided.",
      });
    }
  } else {
    throw badRequest({
      message:
        "search parameter - type = participants || waitingList - must be provided.",
    });
  }

  if (profiles === null) {
    throw notFound({ message: "Participants not found" });
  }

  return profiles;
}

function getFilenameBySearchParams(
  event: Awaited<ReturnType<typeof getEventBySlugOrThrow>>,
  depth: string | null,
  type: string | null
) {
  let filename = event.name;

  if (type === "participants") {
    filename += "_Teilnehmende";
  }
  if (type === "waitingList") {
    filename += "_Warteliste";
  }
  if (depth === "full") {
    filename += "_inklusive_Subveranstaltungen";
  }
  filename += ".csv";

  return filename;
}

function createCsvString(
  profiles: Awaited<ReturnType<typeof getProfilesBySearchParams>>
) {
  let csv = "VORNAME,NACHNAME,EMAIL,VERANSTALTUNG\n";

  for (const profile of profiles) {
    if ("profile" in profile) {
      csv += `"${profile.profile.firstName}","${profile.profile.lastName}","${profile.profile.email}","${profile.profile.eventName}"\n`;
    } else {
      csv += `"${profile.firstName}","${profile.lastName}","${profile.email}","${profile.eventName}"\n`;
    }
  }

  return csv;
}

type LoaderData = Response;

export const loader: LoaderFunction = async (args): Promise<LoaderData> => {
  const { request, params } = args;
  const response = new Response();
  const supabaseClient = createServerClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      request,
      response,
    }
  );

  await checkFeatureAbilitiesOrThrow(supabaseClient, "events");
  const slug = getParamValueOrThrow(params, "slug");
  const sessionUser = await getSessionUserOrThrow(supabaseClient);
  const event = await getEventBySlugOrThrow(slug);
  await checkOwnershipOrThrow(event, sessionUser);

  const url = new URL(request.url);
  const depth = url.searchParams.get("depth");
  const type = url.searchParams.get("type");
  const profiles = await getProfilesBySearchParams(event, depth, type);
  const originalFilename = getFilenameBySearchParams(event, depth, type);
  const filename = escapeFilenameSpecialChars(originalFilename);
  const csv = createCsvString(profiles);
  return new Response(csv, {
    status: 200,
    headers: {
      ...response.headers,
      "Content-Type": "text/csv",
      "Content-Disposition": `filename=${filename}`,
    },
  });
};
