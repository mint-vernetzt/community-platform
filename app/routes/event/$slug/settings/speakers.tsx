import { LoaderFunction } from "remix";
import { getUserByRequestOrThrow } from "~/auth.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { getEventBySlugOrThrow } from "../utils.server";
import {
  checkOwnershipOrThrow,
  getSpeakerProfileDataFromEvent,
} from "./utils.server";

type LoaderData = {
  userId: string;
  eventId: string;
  speakers: ReturnType<typeof getSpeakerProfileDataFromEvent>;
};

export const loader: LoaderFunction = async (args): Promise<LoaderData> => {
  const { request, params } = args;
  await checkFeatureAbilitiesOrThrow(request, "events");
  const slug = await getParamValueOrThrow(params, "slug");
  const currentUser = await getUserByRequestOrThrow(request);
  const event = await getEventBySlugOrThrow(slug);
  await checkOwnershipOrThrow(event, currentUser);

  const speakers = getSpeakerProfileDataFromEvent(event);

  return { userId: currentUser.id, eventId: event.id, speakers };
};

function Speakers() {
  return <h1>Speakers</h1>;
}

export default Speakers;
