import { z } from "zod";

export const SEARCH_SPEAKERS_SEARCH_PARAM = "search_speakers";
export const PROFILE_ID_FIELD = "profileId";
export const INVITE_PROFILE_TO_JOIN_AS_SPEAKER_INTENT =
  "invite-profile-speaker";

export function createSearchSpeakersSchema(locales: {
  validation: {
    min: string;
  };
}) {
  return z.object({
    [SEARCH_SPEAKERS_SEARCH_PARAM]: z
      .string()
      .trim()
      .min(3, { message: locales.validation.min })
      .optional(),
  });
}

export function createInviteProfileToJoinAsSpeakerSchema() {
  return z.object({
    [PROFILE_ID_FIELD]: z.string().uuid(),
  });
}
