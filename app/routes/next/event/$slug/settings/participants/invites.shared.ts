import z from "zod";

export const INVITED_PROFILES_SEARCH_PARAM = "search_invited_profiles";
export const PROFILE_ID = "profileId";

export function createSearchInvitedProfilesToParticipateOnEventSchema(locales: {
  validation: {
    min: string;
  };
}) {
  return z.object({
    [INVITED_PROFILES_SEARCH_PARAM]: z
      .string()
      .trim()
      .min(3, { message: locales.validation.min })
      .optional(),
  });
}

export function createRevokeInviteOfProfileToParticipateOnEventSchema() {
  return z.object({
    [PROFILE_ID]: z.string().trim().uuid(),
  });
}
