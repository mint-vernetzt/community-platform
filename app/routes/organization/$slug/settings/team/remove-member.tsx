import { ActionFunction } from "@remix-run/node";
import { makeDomainFunction } from "remix-domains";
import { PerformMutation, performMutation } from "remix-forms";
import { Schema, z } from "zod";
import { getSessionUserOrThrow } from "~/auth.server";
import {
  checkIdentityOrThrow,
  checkSameOrganizationOrThrow,
} from "../../utils.server";
import {
  disconnectProfileFromOrganization,
  getMembers,
  handleAuthorization,
} from "../utils.server";

const schema = z.object({
  userId: z.string().uuid(),
  teamMemberId: z.string().uuid(),
  organizationId: z.string().uuid(),
});

export const removeMemberSchema = schema;

const mutation = makeDomainFunction(schema)(async (values) => {
  const { teamMemberId, organizationId } = values;
  const members = await getMembers(organizationId);

  // Prevent self deletion
  const privilegedMembersWithoutToRemove = members.filter((member) => {
    return member.isPrivileged && member.profileId !== teamMemberId;
  });

  if (privilegedMembersWithoutToRemove.length > 0) {
    await disconnectProfileFromOrganization(teamMemberId, organizationId);
  } else {
    throw "Unable to remove member - last privileged member.";
  }

  return values;
});

export type ActionData = PerformMutation<
  z.infer<Schema>,
  z.infer<typeof schema>
>;

export const action: ActionFunction = async (args) => {
  const { request } = args;

  const currentUser = await getSessionUserOrThrow(request);
  await checkIdentityOrThrow(request, currentUser);
  const { organization } = await handleAuthorization(args);
  await checkSameOrganizationOrThrow(request, organization.id);

  const result = await performMutation({ request, schema, mutation });

  return result;
};
