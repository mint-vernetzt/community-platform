import { type TFunction } from "i18next";
import { z } from "zod";
import { SearchProfilesSearchParam } from "./searchParams";

export const searchProfilesI18nNS = ["schemas/searchProfiles"];

export const searchProfilesSchema = (t: TFunction) => {
  return z.object({
    [SearchProfilesSearchParam]: z
      .string()
      .min(3, { message: t("content.add.criteria") })
      .optional(),
  });
};
