import { z } from "zod";

export const SEARCH_PARTICIPANTS_SEARCH_PARAM = "search_participants";
export const PROFILE_ID = "profileId";
export const INVITE_PROFILE_PARTICIPATE_INTENT = "invite_profile_participate";

export function createSearchParticipantsSchema(locales: {
  validation: {
    min: string;
  };
}) {
  return z.object({
    [SEARCH_PARTICIPANTS_SEARCH_PARAM]: z
      .string()
      .trim()
      .min(3, { message: locales.validation.min })
      .optional(),
  });
}

export function createInviteProfileToParticipateOnEvent() {
  return z.object({
    [PROFILE_ID]: z.string().uuid(),
  });
}
