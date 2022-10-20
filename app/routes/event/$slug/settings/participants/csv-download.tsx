import { LoaderFunction } from "remix";
import { badRequest, notFound } from "remix-utils";
import { getUserByRequestOrThrow } from "~/auth.server";
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
      profiles = await getFullDepthParticipants(event.id);
    } else if (depth === "single") {
      profiles = event.participants.map((participant) => {
        return participant.profile;
      });
    } else {
      throw badRequest({
        message:
          "search parameter - depth = full || single - must be provided.",
      });
    }
  } else if (type === "waitingList") {
    if (depth === "full") {
      profiles = await getFullDepthWaitingList(event.id);
    } else if (depth === "single") {
      profiles = event.waitingList.map((waitingParticipant) => {
        return waitingParticipant.profile;
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
  let csv = "";

  for (const profile of profiles) {
    if ("profile" in profile) {
      csv += `${profile.profile.firstName},${profile.profile.lastName},${profile.profile.email}\n`;
    } else {
      csv += `${profile.firstName},${profile.lastName},${profile.email}\n`;
    }
  }

  return csv;
}

type LoaderData = Response;

export const loader: LoaderFunction = async (args): Promise<LoaderData> => {
  const { request, params } = args;

  await checkFeatureAbilitiesOrThrow(request, "events");
  const slug = getParamValueOrThrow(params, "slug");
  const currentUser = await getUserByRequestOrThrow(request);
  const event = await getEventBySlugOrThrow(slug);
  await checkOwnershipOrThrow(event, currentUser);

  const url = new URL(request.url);
  const depth = url.searchParams.get("depth");
  const type = url.searchParams.get("type");
  const profiles = await getProfilesBySearchParams(event, depth, type);
  const filename = getFilenameBySearchParams(event, depth, type);
  const csv = createCsvString(profiles);

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `filename="${filename}"`,
    },
  });
};
