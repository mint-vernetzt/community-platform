import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { type TFunction } from "i18next";
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
} from "~/auth.server";
import i18next from "~/i18next.server";
import { escapeFilenameSpecialChars } from "~/lib/string/escapeFilenameSpecialChars";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { detectLanguage } from "~/root.server";
import { deriveEventMode } from "../../utils.server";
import { getFullDepthProfiles } from "../utils.server";
import { getEventBySlug } from "./csv-download.server";

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
      throw json(
        {
          message: t("error.badRequest.depth"),
        },
        { status: 400 }
      );
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
      throw json({
        message: t("error.badRequest.depth", { status: 400 }),
      });
    }
  } else {
    throw json(
      {
        message: t("error.badRequest.type"),
      },
      { status: 400 }
    );
  }

  if (profiles === null) {
    throw json({ message: t("error.badRequest.notFound") }, { status: 404 });
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
  let csv =
    "VORNAME,NACHNAME,EMAIL,POSITION,ORGANISATIONEN,AKTIVITÄTSGEBIETE,VERANSTALTUNG\n";

  for (const profile of profiles) {
    const ref = "profile" in profile ? profile.profile : profile;
    const data = [];
    data.push(`"${ref.firstName}"`);
    data.push(`"${ref.lastName}"`);
    data.push(typeof ref.email === "string" ? `"${ref.email}"` : "");
    data.push(`"${ref.position}"`);
    data.push(
      Array.isArray(ref.memberOf)
        ? `"${ref.memberOf
            .map((rel) => {
              return typeof rel === "string" ? rel : rel.organization.name;
            })
            .join(", ")}"`
        : ""
    );
    data.push(
      Array.isArray(ref.areas)
        ? `"${ref.areas
            .map((rel) => {
              return typeof rel === "string" ? rel : rel.area.name;
            })
            .join(", ")}"`
        : ""
    );
    data.push(
      typeof ref.participatedEvents === "string"
        ? `"${ref.participatedEvents}"`
        : ""
    );
    csv += data.join(",") + "\n";
  }

  return csv;
}

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  const { authClient } = createAuthClient(request);
  const locale = await detectLanguage(request);
  const t = await i18next.getFixedT(locale, [
    "routes-event-settings-csv-download",
  ]);

  await checkFeatureAbilitiesOrThrow(authClient, "events");
  const slug = getParamValueOrThrow(params, "slug");
  const { sessionUser, redirectPath } =
    await getSessionUserOrRedirectPathToLogin(authClient, request);

  if (sessionUser === null && redirectPath !== null) {
    return redirect(redirectPath);
  }
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

  // \uFEFF is the byte order mark (BOM) for UTF-8
  // It is used to tell the receiving program that the text is UTF-8 encoded
  // fix for Excel not recognizing UTF-8 encoding
  return new Response(`\uFEFF${csv}`, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `filename=${filename}`,
    },
  });
};
