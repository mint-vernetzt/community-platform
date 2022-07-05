import { ActionFunction } from "remix";
import { makeDomainFunction } from "remix-domains";
import { performMutation } from "remix-forms";
import { badRequest, forbidden, notFound } from "remix-utils";
import { z } from "zod";
import { getUserByRequest } from "~/auth.server";
import {
  allowedToModify,
  disconnectProfileFromOrganization,
  getMembers,
  getOrganizationBySlug,
} from "./utils.server";

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

export const action: ActionFunction = async (args) => {
  const { params, request } = args;

  const { slug } = params;

  if (slug === undefined) {
    throw badRequest({ message: "Organization slug missing" });
  }

  const currentUser = await getUserByRequest(request);

  if (currentUser === null) {
    throw forbidden({ message: "forbidden" });
  }

  const organization = await getOrganizationBySlug(slug);
  if (organization === null) {
    throw notFound({
      message: `Couldn't find organization with slug "${slug}"`,
    });
  }

  const isAllowedToModify = await allowedToModify(
    currentUser.id,
    organization.id
  );

  if (isAllowedToModify === false) {
    throw forbidden({ message: "forbidden" });
  }

  const result = await performMutation({ request, schema, mutation });

  return result;
};
