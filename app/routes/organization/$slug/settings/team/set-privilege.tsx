import { ActionFunction } from "@remix-run/node";
import { makeDomainFunction } from "remix-domains";
import { PerformMutation, performMutation } from "remix-forms";
import { notFound } from "remix-utils";
import { Schema, z } from "zod";
import { getSessionUserOrThrow } from "~/auth.server";
import { getOrganizationBySlug } from "~/organization.server";
import { getProfileByUserId } from "~/profile.server";
import {
  checkIdentityOrThrow,
  checkSameOrganizationOrThrow,
} from "../../utils.server";
import { handleAuthorization } from "../utils.server";
import { updateOrganizationTeamMemberPrivilege } from "./utils.server";

const schema = z.object({
  userId: z.string().uuid(),
  slug: z.string(),
  teamMemberId: z.string().uuid(),
  organizationId: z.string().uuid(),
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

  const currentUser = await getSessionUserOrThrow(request);
  await checkIdentityOrThrow(request, currentUser);
  const { organization } = await handleAuthorization(args);
  await checkSameOrganizationOrThrow(request, organization.id);

  const result = await performMutation({ request, schema, mutation });

  if (result.success === true) {
    const organization = await getOrganizationBySlug(result.data.slug);
    if (organization === null) {
      throw notFound({ message: "Organization not found" });
    }
    const teamMemberProfile = await getProfileByUserId(
      result.data.teamMemberId
    );
    if (teamMemberProfile !== null) {
      await updateOrganizationTeamMemberPrivilege(
        organization.id,
        result.data.teamMemberId,
        result.data.isPrivileged
      );
    }
  }
  return result;
};
