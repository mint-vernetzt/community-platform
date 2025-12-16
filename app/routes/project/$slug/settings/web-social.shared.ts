import { z } from "zod";
import { type ProjectWebAndSocialLocales } from "./web-social.server";
import {
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

export const createWebSocialSchema = (locales: ProjectWebAndSocialLocales) =>
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
  });
