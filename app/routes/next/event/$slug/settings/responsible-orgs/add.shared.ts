import z from "zod";

export const SEARCH_ORGANIZATIONS_SEARCH_PARAM = "search_responsible_orgs";
export const SEARCH_OWN_ORGANIZATIONS_SEARCH_PARAM = "search_own_organizations";
export const ORGANIZATION_ID_FIELD = "organizationId";
export const INVITE_ORGANIZATION_INTENT =
  "invite-organization-as-responsible-org";
export const ADD_OWN_ORGANIZATION_INTENT =
  "add-own-organization-as-responsible-org";

export function createSearchOwnOrganizationsSchema(locales: {
  validation: {
    min: string;
  };
}) {
  return z.object({
    [SEARCH_OWN_ORGANIZATIONS_SEARCH_PARAM]: z
      .string()
      .trim()
      .min(3, { message: locales.validation.min })
      .optional(),
  });
}

export function createInviteOrganizationSchema() {
  return z.object({
    [ORGANIZATION_ID_FIELD]: z.string().uuid(),
  });
}

export function createSearchOrganizationsSchema(locales: {
  validation: {
    min: string;
  };
}) {
  return z.object({
    [SEARCH_ORGANIZATIONS_SEARCH_PARAM]: z
      .string()
      .trim()
      .min(3, { message: locales.validation.min })
      .optional(),
  });
}

export function createAddOwnOrganizationSchema() {
  return z.object({
    [ORGANIZATION_ID_FIELD]: z.string().uuid(),
  });
}
