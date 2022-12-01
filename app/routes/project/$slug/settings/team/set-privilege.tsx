import { ActionFunction } from "@remix-run/node";
import { makeDomainFunction } from "remix-domains";
import { PerformMutation, performMutation } from "remix-forms";
import { Schema, z } from "zod";
import { getSessionUserOrThrow } from "~/auth.server";
import { getProfileByUserId } from "~/profile.server";
import { checkIdentityOrThrow } from "~/routes/project/utils.server";
import { getProjectByIdOrThrow } from "../../utils.server";
import {
  checkOwnershipOrThrow,
  checkSameProjectOrThrow,
} from "../utils.server";
import { updateProjectTeamMemberPrivilege } from "./utils.server";

const schema = z.object({
  userId: z.string(),
  projectId: z.string(),
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
  const currentUser = await getSessionUserOrThrow(request);
  await checkIdentityOrThrow(request, currentUser);

  const result = await performMutation({ request, schema, mutation });

  if (result.success === true) {
    const project = await getProjectByIdOrThrow(result.data.projectId);
    await checkOwnershipOrThrow(project, currentUser);
    await checkSameProjectOrThrow(request, project.id);
    const teamMemberProfile = await getProfileByUserId(
      result.data.teamMemberId
    );
    if (teamMemberProfile !== null) {
      await updateProjectTeamMemberPrivilege(
        project.id,
        result.data.teamMemberId,
        result.data.isPrivileged
      );
    }
  }
  return result;
};
