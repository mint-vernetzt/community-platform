import { z } from "zod";
import {
  SearchNetworkMembers,
  SearchNetworks,
  SearchOrganizations,
  SearchProfiles,
} from "./lib/utils/searchParams";
import { type OrganizationAdminSettingsLocales } from "./routes/organization/$slug/settings/admins.server";
import { type ManageOrganizationSettingsLocales } from "./routes/organization/$slug/settings/manage.server";
import { type OrganizationTeamSettingsLocales } from "./routes/organization/$slug/settings/team.server";
import { type ProjectAdminSettingsLocales } from "./routes/project/$slug/settings/admins.server";
import { type ProjectTeamSettingsLocales } from "./routes/project/$slug/settings/team.server";
import { type ProjectResponsibleOrganizationsSettingsLocales } from "./routes/project/$slug/settings/responsible-orgs.server";
import { type MyOrganizationsLocales } from "./routes/my/organizations.server";
import { type CreateOrganizationLocales } from "./routes/organization/create.server";

// Field name for determining the intent of the submitted form when using multiple forms on one route -> Please use this as name attribute on form submit button
export const INTENT_FIELD_NAME = "intent";

// List of schemas
export const searchProfilesSchema = (
  locales:
    | OrganizationAdminSettingsLocales
    | OrganizationTeamSettingsLocales
    | ProjectAdminSettingsLocales
    | ProjectTeamSettingsLocales
) => {
  return z.object({
    [SearchProfiles]: z
      .string()
      .trim()
      .min(3, { message: locales.searchProfilesSchema.validation.min })
      .optional(),
  });
};

export const searchOrganizationsSchema = (
  locales:
    | MyOrganizationsLocales
    | ManageOrganizationSettingsLocales
    | ProjectResponsibleOrganizationsSettingsLocales
    | CreateOrganizationLocales
) => {
  return z.object({
    [SearchOrganizations]: z
      .string()
      .trim()
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
      .trim()
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
      .trim()
      .min(3, { message: locales.searchOrganizationsSchema.validation.min })
      .optional(),
  });
};

export const inviteProfileToBeOrganizationAdminSchema = z.object({
  profileId: z.string().trim().uuid(),
});

export const cancelOrganizationAdminInvitationSchema = z.object({
  profileId: z.string().trim().uuid(),
});

export const removeAdminFromOrganizationSchema = z.object({
  profileId: z.string().trim().uuid(),
});

export const inviteProfileToBeOrganizationTeamMemberSchema = z.object({
  profileId: z.string().trim().uuid(),
});

export const cancelOrganizationTeamMemberInvitationSchema = z.object({
  profileId: z.string().trim().uuid(),
});

export const removeTeamMemberFromOrganizationSchema = z.object({
  profileId: z.string().trim().uuid(),
});

// TODO: Use these when implementing project invites
export const inviteProfileToBeProjectAdminSchema = z.object({
  profileId: z.string().trim().uuid(),
});

export const cancelProjectAdminInvitationSchema = z.object({
  profileId: z.string().trim().uuid(),
});

export const removeAdminFromProjectSchema = z.object({
  profileId: z.string().trim().uuid(),
});

export const inviteProfileToBeProjectTeamMemberSchema = z.object({
  profileId: z.string().trim().uuid(),
});

export const cancelProjectTeamMemberInvitationSchema = z.object({
  profileId: z.string().trim().uuid(),
});

export const removeTeamMemberFromProjectSchema = z.object({
  profileId: z.string().trim().uuid(),
});

export const inviteOrganizationToBeResponsibleForProjectSchema = z.object({
  organizationId: z.string().trim().uuid(),
});

export const cancelResponsibleOrganizationForProjectInvitationSchema = z.object(
  {
    organizationId: z.string().trim().uuid(),
  }
);

export const removeResponsibleOrganizationFromProjectSchema = z.object({
  organizationId: z.string().trim().uuid(),
});

// TODO: Remove these when implementing project invites
export const addAdminToProjectSchema = z.object({
  profileId: z.string().trim().uuid(),
});

export const addTeamMeberToProjectSchema = z.object({
  profileId: z.string().trim().uuid(),
});

export const addResponsibleOrganizationToProjectSchema = z.object({
  organizationId: z.string().trim().uuid(),
});
