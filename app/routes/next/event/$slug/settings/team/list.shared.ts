import z from "zod";

export const SEARCH_TEAM_MEMBERS_SEARCH_PARAM = "search_team_members";
export const CONFIRM_MODAL_SEARCH_PARAM = "confirm_remove_team_member";
export const TEAM_MEMBER_ID = "teamMemberId";

export function getSearchTeamMembersSchema() {
  return z.object({
    [SEARCH_TEAM_MEMBERS_SEARCH_PARAM]: z.string().trim().min(3).optional(),
  });
}

export function getRemoveTeamMemberSchema() {
  return z.object({
    [TEAM_MEMBER_ID]: z.string().uuid(),
  });
}
