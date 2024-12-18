import { z } from "zod";
import { SearchProfiles } from "./lib/utils/searchParams";
import { type OrganizationAdminSettingsLocales } from "./routes/next/organization/$slug/settings/admins.server";
import { type OrganizationTeamSettingsLocales } from "./routes/next/organization/$slug/settings/team.server";

// List of schemas and their i18n namespaces
export const searchProfilesSchema = (
  locales: OrganizationAdminSettingsLocales | OrganizationTeamSettingsLocales
) => {
  return z.object({
    [SearchProfiles]: z
      .string()
      .min(3, { message: locales.searchProfilesSchema.validation.min })
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
