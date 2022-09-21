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
        message: 'search parameter "depth = full || single" must be provided.',
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
        message: 'search parameter "depth = full || single" must be provided.',
      });
    }
  } else {
    throw badRequest({
      message:
        'search parameter "type = participants || waitingList" must be provided.',
    });
  }

  if (profiles === null) {
    throw notFound({ message: "Participants not found" });
  }

  return profiles;
}

export function createCsvString() {}

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
  const profiles = getProfilesBySearchParams(event, depth, type);

  return new Response("TODO", {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `filename="${"TODO"}.csv"`,
    },
  });
};
