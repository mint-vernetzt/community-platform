import type { DataFunctionArgs } from "@remix-run/node";
import { badRequest, notFound } from "remix-utils";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { escapeFilenameSpecialChars } from "~/lib/string/escapeFilenameSpecialChars";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { deriveEventMode } from "../../utils.server";
import { getFullDepthProfiles } from "../utils.server";
import { getEventBySlug } from "./csv-download.server";
import { TFunction } from "i18next";
import i18next from "~/i18next.server";

async function getProfilesBySearchParams(
  event: NonNullable<Awaited<ReturnType<typeof getEventBySlug>>>,
  depth: string | null,
  type: string | null,
  t: TFunction
) {
  let profiles;

  const groupBy = "events";
  if (type === "participants") {
    if (depth === "full") {
      profiles = await getFullDepthProfiles(event.id, "participants", groupBy);
    } else if (depth === "single") {
      profiles = event.participants.map((participant) => {
        return { ...participant.profile, participatedEvents: event.name };
      });
    } else {
      throw badRequest({
        message: t("error.badRequest.depth"),
      });
    }
  } else if (type === "waitingList") {
    if (depth === "full") {
      profiles = await getFullDepthProfiles(event.id, "waitingList", groupBy);
    } else if (depth === "single") {
      profiles = event.waitingList.map((waitingParticipant) => {
        return {
          ...waitingParticipant.profile,
          participatedEvents: event.name,
        };
      });
    } else {
      throw badRequest({
        message: t("error.badRequest.depth"),
      });
    }
  } else {
    throw badRequest({
      message: t("error.badRequest.type"),
    });
  }

  if (profiles === null) {
    throw notFound({ message: t("error.badRequest.notFound") });
  }

  return profiles;
}

function getFilenameBySearchParams(
  event: NonNullable<Awaited<ReturnType<typeof getEventBySlug>>>,
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
        profile.profile.memberOf !== undefined
          ? profile.profile.memberOf.join(", ")
          : ""
      }","${profile.profile.participatedEvents || ""}"\n`;
    } else {
      csv += `"${profile.firstName}","${profile.lastName}","${
        profile.email
      }","${profile.position}","${profile.memberOf
        .map((organization) => {
          return organization.organization.name;
        })
        .join(", ")}","${profile.participatedEvents}"\n`;
    }
  }

  return csv;
}

export const loader = async (args: DataFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();
  const authClient = createAuthClient(request, response);
  const t = await i18next.getFixedT(request, [
    "routes/event/settings/csv-download",
  ]);
  await checkFeatureAbilitiesOrThrow(authClient, "events");
  const slug = getParamValueOrThrow(params, "slug");
  const sessionUser = await getSessionUserOrThrow(authClient);
  const event = await getEventBySlug(slug);
  invariantResponse(event, "Event not found", { status: 404 });
  const mode = await deriveEventMode(sessionUser, slug);
  invariantResponse(mode === "admin", t("error.notPrivileged"), {
    status: 403,
  });

  const url = new URL(request.url);
  const depth = url.searchParams.get("depth");
  const type = url.searchParams.get("type");
  const profiles = await getProfilesBySearchParams(event, depth, type, t);
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
