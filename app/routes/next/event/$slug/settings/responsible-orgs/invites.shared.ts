import z from "zod";

export const INVITED_ORGANIZATIONS_SEARCH_PARAM =
  "search_invited_organizations";
export const ORGANIZATION_ID_FIELD = "organizationId";

export function createSearchInvitedOrganizationsSchema(locales: {
  validation: {
    min: string;
  };
}) {
  return z.object({
    [INVITED_ORGANIZATIONS_SEARCH_PARAM]: z
      .string()
      .trim()
      .min(3, { message: locales.validation.min })
      .optional(),
  });
}

export function createRevokeOrganizationInviteSchema() {
  return z.object({
    [ORGANIZATION_ID_FIELD]: z.string().trim().uuid(),
  });
}
