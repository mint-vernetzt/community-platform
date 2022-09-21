import { LoaderFunction } from "remix";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import {
  getEventBySlugOrThrow,
  getFullDepthParticipants,
} from "../../utils.server";

export function createCsvString() {}

type LoaderData = Response;

export const loader: LoaderFunction = async (args): Promise<LoaderData> => {
  const { request, params } = args;

  const slug = getParamValueOrThrow(params, "slug");
  const event = await getEventBySlugOrThrow(slug);

  const url = new URL(request.url);
  const depth = url.searchParams.get("depth");
  const type = url.searchParams.get("type");

  if (type === "participants") {
    if (depth === "full") {
    } else {
    }
  }
  const fullDepthParticipants = await getFullDepthParticipants(event.id);

  return new Response("TODO", {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `filename="${"TODO"}.csv"`,
    },
  });
};
