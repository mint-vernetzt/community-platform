import { z } from "zod";

export const EVENT_ID = "eventId";
export const ACCEPT_ADMIN_INVITE_INTENT = "accept-admin-invite";
export const REJECT_ADMIN_INVITE_INTENT = "reject-admin-invite";
export const ACCEPT_TEAM_MEMBER_INVITE_INTENT = "accept-team-member-invite";
export const REJECT_TEAM_MEMBER_INVITE_INTENT = "reject-team-member-invite";

export function createAcceptOrRejectInviteAsAdminSchema() {
  return z.object({
    [EVENT_ID]: z.string().uuid(),
  });
}
