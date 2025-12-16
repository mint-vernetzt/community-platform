import {
  checkboxSchema,
  createFacebookSchema,
  createInstagramSchema,
  createLinkedinSchema,
  createMastodonSchema,
  createTiktokSchema,
  createTwitterSchema,
  createWebsiteSchema,
  createXingSchema,
  createYoutubeSchema,
} from "~/lib/utils/schemas";
import { type OrganizationWebAndSocialLocales } from "./web-social.server";
import { z } from "zod";

export const createWebSocialSchema = (
  locales: OrganizationWebAndSocialLocales
) =>
  z.object({
    website: createWebsiteSchema(locales),
    facebook: createFacebookSchema(locales),
    linkedin: createLinkedinSchema(locales),
    xing: createXingSchema(locales),
    twitter: createTwitterSchema(locales),
    mastodon: createMastodonSchema(locales),
    tiktok: createTiktokSchema(locales),
    instagram: createInstagramSchema(locales),
    youtube: createYoutubeSchema(locales),
    visibilities: z.object({
      website: checkboxSchema,
      facebook: checkboxSchema,
      linkedin: checkboxSchema,
      xing: checkboxSchema,
      twitter: checkboxSchema,
      mastodon: checkboxSchema,
      tiktok: checkboxSchema,
      instagram: checkboxSchema,
      youtube: checkboxSchema,
    }),
  });
