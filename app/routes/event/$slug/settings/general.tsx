import { ActionFunction, LoaderFunction } from "remix";
import { getUserByRequestOrThrow } from "~/auth.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { getEventBySlugOrThrow } from "../utils.server";
import { checkIdentityOrThrow, checkOwnershipOrThrow } from "./utils.server";

type LoaderData = {
  event: Awaited<ReturnType<typeof getEventBySlugOrThrow>>;
};

export const loader: LoaderFunction = async (args): Promise<LoaderData> => {
  const { request, params } = args;
  await checkFeatureAbilitiesOrThrow(request, "events");

  const slug = getParamValueOrThrow(params, "slug");

  const currentUser = await getUserByRequestOrThrow(request);
  const event = await getEventBySlugOrThrow(slug);

  await checkOwnershipOrThrow(event, currentUser);

  return { event };
};

export const action: ActionFunction = async (args) => {
  const { request, params } = args;

  await checkFeatureAbilitiesOrThrow(request, "events");

  const slug = getParamValueOrThrow(params, "slug");
  const currentUser = await getUserByRequestOrThrow(request);

  await checkIdentityOrThrow(request, currentUser);

  const event = await getEventBySlugOrThrow(slug);

  await checkOwnershipOrThrow(event, currentUser);

  return null;
};

function General() {
  return <h1>General</h1>;
}

export default General;
