import { createServerClient } from "@supabase/auth-helpers-remix";
import { ActionFunction, json } from "remix";
import { makeDomainFunction } from "remix-domains";
import { PerformMutation, performMutation } from "remix-forms";
import { Schema, z } from "zod";
import { getSessionUserOrThrow } from "~/auth.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { getProfileByUserId } from "~/profile.server";
import { checkSameEventOrThrow, getEventByIdOrThrow } from "../../utils.server";
import { checkIdentityOrThrow, checkOwnershipOrThrow } from "../utils.server";
import { updateEventTeamMemberPrivilege } from "./utils.server";

const schema = z.object({
  userId: z.string(),
  eventId: z.string(),
  teamMemberId: z.string().min(1),
  isPrivileged: z.boolean(),
});

export const setPrivilegeSchema = schema;

const mutation = makeDomainFunction(schema)(async (values) => {
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
    const teamMemberProfile = await getProfileByUserId(
      result.data.teamMemberId
    );
    if (teamMemberProfile !== null) {
      await updateEventTeamMemberPrivilege(
        event.id,
        result.data.teamMemberId,
        result.data.isPrivileged
      );
    }
  }
  return json<ActionData>(result, { headers: response.headers });
};
