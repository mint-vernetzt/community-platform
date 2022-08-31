import { LoaderFunction } from "remix";
import { getUserByRequestOrThrow } from "~/auth.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { getEventBySlugOrThrow } from "../utils.server";
import {
  checkOwnershipOrThrow,
  getResponsibleOrganizationDataFromEvent,
} from "./utils.server";

type LoaderData = {
  userId: string;
  eventId: string;
  organizations: ReturnType<typeof getResponsibleOrganizationDataFromEvent>;
};

export const loader: LoaderFunction = async (args): Promise<LoaderData> => {
  const { request, params } = args;
  await checkFeatureAbilitiesOrThrow(request, "events");
  const slug = getParamValueOrThrow(params, "slug");
  const currentUser = await getUserByRequestOrThrow(request);
  const event = await getEventBySlugOrThrow(slug);
  await checkOwnershipOrThrow(event, currentUser);

  const organizations = getResponsibleOrganizationDataFromEvent(event);
  return { userId: currentUser.id, eventId: event.id, organizations };
};

function Organizations() {
  return <h1>Organizations</h1>;
}

export default Organizations;
