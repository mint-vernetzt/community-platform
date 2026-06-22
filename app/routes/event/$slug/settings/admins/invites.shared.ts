import { z } from "zod";

export const INVITED_PROFILES_SEARCH_PARAM = "search_invited_profiles";
export const PROFILE_ID_FIELD = "profileId";

export function createSearchInvitedProfilesSchema(locales: {
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

export function createRevokeInviteOfProfileToJoinEventAsAdminSchema() {
  return z.object({
    [PROFILE_ID_FIELD]: z.string().trim().uuid(),
  });
}
