import type { LoaderFunction } from "@remix-run/node";
import { badRequest, notFound } from "remix-utils";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { escapeFilenameSpecialChars } from "~/lib/string/escapeFilenameSpecialChars";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import {
  getEventBySlugOrThrow,
  getFullDepthProfiles,
} from "../../utils.server";
import { checkOwnershipOrThrow } from "../utils.server";

async function getProfilesBySearchParams(
  event: Awaited<ReturnType<typeof getEventBySlugOrThrow>>,
  depth: string | null,
  type: string | null
) {
  let profiles;

  const groupBy = "events";
  if (type === "participants") {
    if (depth === "full") {
      profiles = await getFullDepthProfiles(event.id, "participants", groupBy);
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
      profiles = await getFullDepthProfiles(event.id, "waitingList", groupBy);
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
    filename += " Teilnehmende";
  }
  if (type === "waitingList") {
    filename += " Warteliste";
  }
  if (depth === "full") {
    filename += " inklusive Subveranstaltungen";
  }
  filename += ".csv";

  return filename;
}

function createCsvString(
  profiles: Awaited<ReturnType<typeof getProfilesBySearchParams>>
) {
  let csv = "VORNAME,NACHNAME,EMAIL,POSITION,ORGANISATIONEN,VERANSTALTUNG\n";

  for (const profile of profiles) {
    if ("profile" in profile) {
      csv += `"${profile.profile.firstName}","${profile.profile.lastName}","${
        profile.profile.email || ""
      }","${profile.profile.position}","${
        profile.profile.organizationNames !== undefined
          ? profile.profile.organizationNames.join(", ")
          : ""
      }","${profile.profile.eventName || ""}"\n`;
    } else {
      csv += `"${profile.firstName}","${profile.lastName}","${
        profile.email
      }","${profile.position}","${profile.memberOf
        .map((organization) => {
          return organization.organization.name;
        })
        .join(", ")}","${profile.eventName}"\n`;
    }
  }

  return csv;
}

type LoaderData = Response;

export const loader: LoaderFunction = async (args): Promise<LoaderData> => {
  const { request, params } = args;
  const response = new Response();
  const authClient = createAuthClient(request, response);

  await checkFeatureAbilitiesOrThrow(authClient, "events");
  const slug = getParamValueOrThrow(params, "slug");
  const sessionUser = await getSessionUserOrThrow(authClient);
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
