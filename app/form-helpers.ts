import { z } from "zod";
import {
  SearchNetworkMembers,
  SearchNetworks,
  SearchOrganizations,
  SearchProfiles,
} from "./lib/utils/searchParams";
import { type OrganizationAdminSettingsLocales } from "./routes/organization/$slug/settings/admins.server";
import { type OrganizationTeamSettingsLocales } from "./routes/organization/$slug/settings/team.server";
import { type ManageOrganizationSettingsLocales } from "./routes/organization/$slug/settings/manage.server";

// Field name for inputs with type file to make file parser work -> Please use this as name attribute on all file uploads
export const FILE_FIELD_NAME = "file";

// List of schemas
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

export const searchOrganizationsSchema = (
  locales: ManageOrganizationSettingsLocales
) => {
  return z.object({
    [SearchOrganizations]: z
      .string()
      .min(3, { message: locales.searchOrganizationsSchema.validation.min })
      .optional(),
  });
};

export const searchNetworksSchema = (
  locales: ManageOrganizationSettingsLocales
) => {
  return z.object({
    [SearchNetworks]: z
      .string()
      .min(3, { message: locales.searchOrganizationsSchema.validation.min })
      .optional(),
  });
};

export const searchNetworkMembersSchema = (
  locales: ManageOrganizationSettingsLocales
) => {
  return z.object({
    [SearchNetworkMembers]: z
      .string()
      .min(3, { message: locales.searchOrganizationsSchema.validation.min })
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
