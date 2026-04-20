import z from "zod";

export const SEARCH_TEAM_MEMBERS_SEARCH_PARAM = "search_team_members";
export const SEARCH_ADMINS_SEARCH_PARAM = "search_admins";
export const PROFILE_ID_FIELD = "profileId";
export const INVITE_PROFILE_TO_JOIN_AS_TEAM_MEMBER_INTENT =
  "invite-profile-team-member";
export const ADD_ADMIN_AS_TEAM_MEMBER_INTENT = "add-admin-team-member";

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

export function createInviteProfileToJoinAsTeamMemberSchema() {
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

export function createAddAdminAsTeamMemberSchema() {
  return z.object({
    [PROFILE_ID_FIELD]: z.string().uuid(),
  });
}
