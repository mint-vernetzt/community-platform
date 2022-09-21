import { LoaderFunction } from "remix";
import { getParamValueOrThrow } from "~/lib/utils/routes";

export function createCsvString() {}

type LoaderData = Response;

export const loader: LoaderFunction = async (args): Promise<LoaderData> => {
  const { request, params } = args;

  const slug = getParamValueOrThrow(params, "slug");

  return new Response("TODO", {
    status: 200,
    headers: {
      "Content-Type": "text/calendar",
      "Content-Disposition": `filename="${"TODO"}.ics"`,
    },
  });
};
