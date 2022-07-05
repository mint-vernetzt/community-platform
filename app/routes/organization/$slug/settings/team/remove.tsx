import { ActionFunction, LoaderFunction, redirect } from "remix";
import { makeDomainFunction } from "remix-domains";
import { performMutation } from "remix-forms";
import { z } from "zod";
import {
  disconnectProfileFromOrganization,
  getMembers,
  handleAuthorization,
} from "././../utils.server";

export const schema = z.object({
  profileId: z.string().uuid(),
  organizationId: z.string().uuid(),
});

const mutation = makeDomainFunction(schema)(async (values) => {
  const { profileId, organizationId } = values;
  const members = await getMembers(organizationId);

  const privilegedMembersWithoutToRemove = members.filter((member) => {
    return member.isPrivileged && member.profileId !== profileId;
  });

  if (privilegedMembersWithoutToRemove.length > 0) {
    await disconnectProfileFromOrganization(profileId, organizationId);
  } else {
    throw "Unable to remove member - last privileged member.";
  }

  return values;
});

export const loader: LoaderFunction = async (args) => {
  return redirect(".");
};

export const action: ActionFunction = async (args) => {
  const { request } = args;

  await handleAuthorization(args);

  const result = await performMutation({ request, schema, mutation });

  return result;
};
