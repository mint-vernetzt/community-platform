import { z } from "zod";

export const SEARCH_SPEAKERS_SEARCH_PARAM = "search_speakers";
export const CONFIRM_MODAL_SEARCH_PARAM = "confirm_remove_speaker";
export const SPEAKER_ID = "speakerId";

export function getSearchSpeakersSchema() {
  return z.object({
    [SEARCH_SPEAKERS_SEARCH_PARAM]: z.string().trim().min(3).optional(),
  });
}

export function getRemoveSpeakerSchema() {
  return z.object({
    [SPEAKER_ID]: z.string().uuid(),
  });
}
