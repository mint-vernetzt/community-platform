import { z } from "zod";

export const SEARCH_RESPONSIBLE_ORGS_SEARCH_PARAM = "search_responsible_orgs";
export const CONFIRM_MODAL_SEARCH_PARAM = "confirm_remove_responsible_org";
export const RESPONSIBLE_ORG_ID = "responsibleOrgId";

export function getSearchResponsibleOrgsSchema() {
  return z.object({
    [SEARCH_RESPONSIBLE_ORGS_SEARCH_PARAM]: z.string().trim().min(3).optional(),
  });
}

export function getRemoveResponsibleOrgSchema() {
  return z.object({
    [RESPONSIBLE_ORG_ID]: z.string().uuid(),
  });
}
