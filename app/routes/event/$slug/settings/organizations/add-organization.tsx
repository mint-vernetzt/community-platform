import { createServerClient } from "@supabase/auth-helpers-remix";
import { ActionFunction, json } from "remix";
import { InputError, makeDomainFunction } from "remix-domains";
import { PerformMutation, performMutation } from "remix-forms";
import { Schema, z } from "zod";
import { getSessionUserOrThrow } from "~/auth.server";
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

export type ActionData = PerformMutation<
  z.infer<Schema>,
  z.infer<typeof schema>
>;

export const action: ActionFunction = async (args) => {
  const { request } = args;
  const response = new Response();
  const supabaseClient = createServerClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      request,
      response,
    }
  );
  await checkFeatureAbilitiesOrThrow(supabaseClient, "events");
  const sessionUser = await getSessionUserOrThrow(supabaseClient);
  await checkIdentityOrThrow(request, sessionUser);

  const result = await performMutation({ request, schema, mutation });

  if (result.success === true) {
    const event = await getEventByIdOrThrow(result.data.eventId);
    await checkOwnershipOrThrow(event, sessionUser);
    await checkSameEventOrThrow(request, event.id);
    const organization = await getOrganizationByName(
      result.data.organizationName
    );
    if (organization !== null) {
      await connectOrganizationToEvent(event.id, organization.id);
    }
  }
  return json<ActionData>(result, { headers: response.headers });
};
