import { z } from "zod";

export const SEARCH_ADMINS_SEARCH_PARAM = "search_admins";
export const CONFIRM_MODAL_SEARCH_PARAM = "confirm_remove_admin";
export const ADMIN_ID_SEARCH_PARAM = "admin_id";
export const ADMIN_ID = "adminId";

export function getSearchAdminsSchema() {
  return z.object({
    [SEARCH_ADMINS_SEARCH_PARAM]: z.string().trim().min(3).optional(),
  });
}

export function getRemoveAdminSchema() {
  return z.object({
    [ADMIN_ID]: z.string().uuid(),
  });
}
