import type { ActionFunction } from "@remix-run/node";
import { InputError, makeDomainFunction } from "remix-domains";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { getUserByRequestOrThrow } from "~/auth.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { getOrganizationByName } from "~/routes/organization/$slug/settings/utils.server";
import { checkSameEventOrThrow, getEventByIdOrThrow } from "../../utils.server";
import { checkIdentityOrThrow, checkOwnershipOrThrow } from "../utils.server";
import { connectOrganizationToEvent } from "./utils.server";

const schema = z.object({
  userId: z.string(),
  eventId: z.string(),
  organizationName: z.string(),
});

export const addOrganizationSchema = schema;

const mutation = makeDomainFunction(schema)(async (values) => {
  const organization = await getOrganizationByName(values.organizationName);
  if (organization === null) {
    throw new InputError(
      "Es existiert noch keine Organisation mit diesem Namen.",
      "organizationName"
    );
  }
  const alreadyMember = organization.responsibleForEvents.some((entry) => {
    return entry.event.id === values.eventId;
  });
  if (alreadyMember) {
    throw new InputError(
      "Die Organisation mit diesem Namen ist bereits für Eure Veranstaltung verantwortlich.",
      "organizationName"
    );
  }
  return values;
});

export const action: ActionFunction = async (args) => {
  const { request } = args;
  await checkFeatureAbilitiesOrThrow(request, "events");
  const currentUser = await getUserByRequestOrThrow(request);
  await checkIdentityOrThrow(request, currentUser);

  const result = await performMutation({ request, schema, mutation });

  if (result.success === true) {
    const event = await getEventByIdOrThrow(result.data.eventId);
    await checkOwnershipOrThrow(event, currentUser);
    await checkSameEventOrThrow(request, event.id);
    const organization = await getOrganizationByName(
      result.data.organizationName
    );
    if (organization !== null) {
      await connectOrganizationToEvent(event.id, organization.id);
    }
  }
  return result;
};
