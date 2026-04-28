import { z } from "zod";

export const EVENT_ID = "eventId";
export const ORGANIZATION_ID = "organizationId";
export const ACCEPT_ADMIN_INVITE_INTENT = "accept-admin-invite";
export const REJECT_ADMIN_INVITE_INTENT = "reject-admin-invite";
export const ACCEPT_TEAM_MEMBER_INVITE_INTENT = "accept-team-member-invite";
export const REJECT_TEAM_MEMBER_INVITE_INTENT = "reject-team-member-invite";
export const ACCEPT_SPEAKER_INVITE_INTENT = "accept-speaker-invite";
export const REJECT_SPEAKER_INVITE_INTENT = "reject-speaker-invite";
export const ACCEPT_RESPONSIBLE_ORGANIZATION_INVITE_INTENT =
  "accept-responsible-organization-invite";
export const REJECT_RESPONSIBLE_ORGANIZATION_INVITE_INTENT =
  "reject-responsible-organization-invite";

export function createAcceptOrRejectInviteSchema() {
  return z.object({
    [EVENT_ID]: z.string().uuid(),
    [ORGANIZATION_ID]: z.string().uuid().optional(),
  });
}
