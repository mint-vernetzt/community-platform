import { z } from "zod";

export const SEARCH_ADMINS_SEARCH_PARAM = "search_admins";
export const SEARCH_TEAM_MEMBERS_SEARCH_PARAM = "search_team_members";
export const PROFILE_ID_FIELD = "profileId";
export const INVITE_PROFILE_TO_JOIN_AS_ADMIN_INTENT = "invite-profile-admin";
export const ADD_TEAM_MEMBER_AS_ADMIN_INTENT = "add-team-admin";

export function createSearchAdminsSchema(locales: {
  validation: {
    min: string;
  };
}) {
  return z.object({
    [SEARCH_ADMINS_SEARCH_PARAM]: z
      .string()
      .trim()
      .min(3, { message: locales.validation.min })
      .optional(),
  });
}

export function createInviteProfileToJoinAsAdminSchema() {
  return z.object({
    [PROFILE_ID_FIELD]: z.string().uuid(),
  });
}

export function createSearchTeamMembersSchema(locales: {
  validation: {
    min: string;
  };
}) {
  return z.object({
    [SEARCH_TEAM_MEMBERS_SEARCH_PARAM]: z
      .string()
      .trim()
      .min(3, { message: locales.validation.min })
      .optional(),
  });
}

export function createAddTeamMemberAsAdminSchema() {
  return z.object({
    [PROFILE_ID_FIELD]: z.string().uuid(),
  });
}
