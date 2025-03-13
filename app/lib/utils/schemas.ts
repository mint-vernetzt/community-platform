import { z } from "zod";
import { type GeneralOrganizationSettingsLocales } from "~/routes/organization/$slug/settings/general.server";
import { type OrganizationWebAndSocialLocales } from "~/routes/organization/$slug/settings/web-social.server";
import { type ProjectDetailsSettingsLocales } from "~/routes/project/$slug/settings/details.server";
import { type GeneralProjectSettingsLocales } from "~/routes/project/$slug/settings/general.server";
import { type ProjectWebAndSocialLocales } from "~/routes/project/$slug/settings/web-social.server";

type WebAndSocialLocales =
  | OrganizationWebAndSocialLocales
  | ProjectWebAndSocialLocales;

export const checkboxSchema = z
  .boolean()
  .optional()
  .transform((value) => {
    if (value === undefined) {
      return false;
    }
    return value;
  });

export const createPhoneSchema = (
  locales:
    | OrganizationWebAndSocialLocales
    | GeneralProjectSettingsLocales
    | GeneralOrganizationSettingsLocales
) =>
  z.string().regex(
    // Escape in following regex -> See: https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/pattern#overview
    // eslint-disable-next-line no-useless-escape
    /^$|^(\+?[0-9 \-\(\)]{3,}\/?[0-9 \-\(\)]{4,})$/,
    locales.schemas.validation.phone.regex
  );

function addProtocolToUrl(url: string) {
  if (url.search(/^https?:\/\//) === -1) {
    url = `https://${url}`;
  }
  return url;
}

export const createWebsiteSchema = (locales: WebAndSocialLocales) =>
  z
    .string()
    .regex(
      // Escape in following regex -> See: https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/pattern#overview
      // eslint-disable-next-line no-useless-escape
      /^(https:\/\/)(www\.)?[\-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9\(\)]{1,9}\b([\-a-zA-Z0-9\(\)@:%_+.~#?&\/\/=]*)/gi,
      {
        message: locales.schemas.validation.website.regex,
      }
    )
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return null;
      }
      const trimmedValue = value.trim();
      if (trimmedValue === "") {
        return null;
      }
      return trimmedValue;
    });

export const createFacebookSchema = (locales: WebAndSocialLocales) =>
  z
    .string()
    .regex(/^(https:\/\/)([a-z0-9]+\.)?facebook.com\/.+$|^$/, {
      message: locales.schemas.validation.facebook.regex,
    })
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return null;
      }
      const trimmedValue = value.trim();
      if (trimmedValue === "") {
        return null;
      }
      return trimmedValue;
    });

export const createLinkedinSchema = (locales: WebAndSocialLocales) =>
  z
    .string()
    .regex(/^(https:\/\/)([a-z0-9]+\.)?linkedin.com\/.+$|^$/, {
      message: locales.schemas.validation.linkedin.regex,
    })
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return null;
      }
      const trimmedValue = value.trim();
      if (trimmedValue === "") {
        return null;
      }
      return trimmedValue;
    });

export const createXingSchema = (locales: WebAndSocialLocales) =>
  z
    .string()
    .regex(/^(https:\/\/)([a-z0-9]+\.)?xing.com\/.+$|^$/, {
      message: locales.schemas.validation.xing.regex,
    })
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return null;
      }
      const trimmedValue = value.trim();
      if (trimmedValue === "") {
        return null;
      }
      return trimmedValue;
    });

export const createTwitterSchema = (locales: WebAndSocialLocales) =>
  z
    .string()
    .regex(/^(https:\/\/)([a-z0-9]+\.)?(twitter|x).com\/.+$|^$/, {
      message: locales.schemas.validation.twitter.regex,
    })
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return null;
      }
      const trimmedValue = value.trim();
      if (trimmedValue === "") {
        return null;
      }
      return trimmedValue;
    });

export const createMastodonSchema = (locales: WebAndSocialLocales) =>
  createWebsiteSchema(locales);

export const createBlueskySchema = (locales: WebAndSocialLocales) =>
  z
    .string()
    .regex(/^(https:\/\/)([a-z0-9]+\.)?bsky.app\/.+$|^$/, {
      message: locales.schemas.validation.bluesky.regex,
    })
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return null;
      }
      const trimmedValue = value.trim();
      if (trimmedValue === "") {
        return null;
      }
      return trimmedValue;
    });

export const createTiktokSchema = (locales: WebAndSocialLocales) =>
  z
    .string()
    .regex(/^(https:\/\/)([a-z0-9]+\.)?tiktok.com\/.+$|^$/, {
      message: locales.schemas.validation.tiktok.regex,
    })
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return null;
      }
      const trimmedValue = value.trim();
      if (trimmedValue === "") {
        return null;
      }
      return trimmedValue;
    });

export const createInstagramSchema = (locales: WebAndSocialLocales) =>
  z
    .string()
    .regex(/^(https:\/\/)([a-z0-9]+\.)?instagram.com\/.+$|^$/, {
      message: locales.schemas.validation.instagram.regex,
    })
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return null;
      }
      const trimmedValue = value.trim();
      if (trimmedValue === "") {
        return null;
      }
      return trimmedValue;
    });

export const createYoutubeSchema = (locales: WebAndSocialLocales) =>
  z
    .string()
    .regex(/^(https:\/\/)([a-z0-9]+\.)?youtube.com\/.+$|^$/, {
      message: locales.schemas.validation.youtube.regex,
    })
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return null;
      }
      const trimmedValue = value.trim();
      if (trimmedValue === "") {
        return null;
      }
      return trimmedValue;
    });

export const createYoutubeEmbedSchema = (
  locales: ProjectDetailsSettingsLocales
) =>
  z
    .string()
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return null;
      }
      const trimmedValue = value.trim();
      if (trimmedValue === "") {
        return null;
      }
      let embedLink = trimmedValue;
      // IFrame: <iframe ... src="https://www.youtube.com/embed/<videoCode>?si=k6KomOnFdKtnSGGP" ... </iframe>
      if (trimmedValue.startsWith("<iframe")) {
        embedLink = trimmedValue.split('src="')[1].split('" ')[0];
      } else {
        let url;
        let videoCodeParam;
        const enhancedValue = addProtocolToUrl(trimmedValue);
        try {
          url = new URL(enhancedValue);
        } catch (e: unknown) {
          console.error(e);
          if ((e as Error).message !== undefined) {
            throw new Error((e as Error).message);
          } else {
            throw new Error(locales.schemas.validation.youtubeEmbed.urlParsing);
          }
        }
        // Watch Link: https://www.youtube.com/watch?v=<videoCode>
        if (trimmedValue.includes("youtube.com/watch")) {
          videoCodeParam = url.searchParams.get("v");
          url.searchParams.delete("v");
          embedLink = `https://www.youtube.com/embed/${videoCodeParam}${url.search}`;
        }
        // Share Link: https://www.youtu.be/<videoCode> || https://www.youtube.com/live/<videoCode>
        if (
          trimmedValue.includes("youtu.be") ||
          trimmedValue.includes("youtube.com/live")
        ) {
          if (trimmedValue.includes("youtu.be")) {
            videoCodeParam = url.pathname;
          } else {
            videoCodeParam = url.pathname.split("/live")[1];
          }
          const timeParam = url.searchParams.get("t");
          if (timeParam !== null) {
            url.searchParams.append("amp;start", timeParam);
            url.searchParams.delete("t");
          }
          embedLink = `https://www.youtube.com/embed${videoCodeParam}${url.search}`;
        }
        // Embed Link: https://www.youtube.com/embed/<videoCode> || https://www.youtube-nocookie.com/embed/<videoCode>
        if (
          trimmedValue.includes("youtube.com/embed") ||
          trimmedValue.includes("youtube-nocookie.com/embed")
        ) {
          embedLink = enhancedValue;
        }
      }
      return embedLink;
    })
    .pipe(
      z
        .string()
        .regex(
          /^(?:https?:\/\/)?(?:[a-z0-9]+\.)?(?:youtube(?:-nocookie)?\.com\/(?:embed\/)).+$/,
          {
            message: locales.schemas.validation.youtubeEmbed.regex,
          }
        )
        .nullable()
    );
