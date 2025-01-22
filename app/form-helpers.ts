import { type TFunction } from "i18next";
import { z } from "zod";
import { SearchProfiles } from "./lib/utils/searchParams";

// List of schemas and their i18n namespaces
export const searchProfilesI18nNS = ["schemas/searchProfiles"];
export const searchProfilesSchema = (t: TFunction) => {
  return z.object({
    [SearchProfiles]: z
      .string()
      .min(3, { message: t("content.add.criteria") })
      .optional(),
  });
};

export const inviteProfileToBeOrganizationAdminSchema = z.object({
  profileId: z.string().uuid(),
});

export const cancelOrganizationAdminInvitationSchema = z.object({
  profileId: z.string().uuid(),
});

export const removeAdminFromOrganizationSchema = z.object({
  profileId: z.string().uuid(),
});

export const inviteProfileToBeOrganizationTeamMemberSchema = z.object({
  profileId: z.string().uuid(),
});

export const cancelOrganizationTeamMemberInvitationSchema = z.object({
  profileId: z.string().uuid(),
});

export const removeTeamMemberFromOrganizationSchema = z.object({
  profileId: z.string().uuid(),
});
