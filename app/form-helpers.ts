import { type TFunction } from "i18next";
import { z } from "zod";

// List to better keep track of used search params
export const SearchProfilesSearchParam = "search-profiles";
export const DeepSearchParam = "deep";

// List of schemas and their i18n namespaces
export const searchProfilesI18nNS = ["schemas/searchProfiles"];
export const searchProfilesSchema = (t: TFunction) => {
  return z.object({
    [SearchProfilesSearchParam]: z
      .string()
      .min(3, { message: t("content.add.criteria") })
      .optional(),
  });
};

export const inviteProfileToBeOrganizationAdminSchema = z.object({
  profileId: z.string().uuid(),
});
