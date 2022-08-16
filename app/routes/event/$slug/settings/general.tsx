import { LoaderFunction } from "remix";
import { badRequest } from "remix-utils";
import { getUserByRequest } from "~/auth.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { getEventBySlugOrThrow } from "../utils.server";
import { checkOwnershipOrThrow } from "./utils.server";

type LoaderData = {
  event: Awaited<ReturnType<typeof getEventBySlugOrThrow>>;
};

export const loader: LoaderFunction = async (args): Promise<LoaderData> => {
  const { request, params } = args;
  const { slug } = params;

  if (slug === undefined || typeof slug !== "string") {
    throw badRequest({ message: '"slug" missing' });
  }

  const currentUser = await getUserByRequest(request);
  const event = await getEventBySlugOrThrow(slug);

  await checkOwnershipOrThrow(event, currentUser);

  await checkFeatureAbilitiesOrThrow(request, "events");

  return { event };
};

function General() {
  return <h1>General</h1>;
}

export default General;
