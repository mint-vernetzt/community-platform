import { z } from "zod";
import { type ChangeOrganizationUrlLocales } from "./change-url.server";

export function createSchema(locales: ChangeOrganizationUrlLocales) {
  return z.object({
    slug: z
      .string()
      .min(3, locales.route.validation.slug.min)
      .max(50, locales.route.validation.slug.max)
      .regex(/^[-a-z0-9-]+$/i, locales.route.validation.slug.regex),
  });
}
