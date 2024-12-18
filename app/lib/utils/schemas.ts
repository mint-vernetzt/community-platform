import { z } from "zod";
import { type OrganizationWebAndSocialLocales } from "~/routes/next/organization/$slug/settings/web-social.server";

export const i18nNS = "utils-schemas" as const;

export const checkboxSchema = z
  .boolean()
  .optional()
  .transform((value) => {
    if (value === undefined) {
      return false;
    }
    return value;
  });

export const fileUploadSchema = z.object({
  subject: z.string(),
  slug: z.string().min(1),
  uploadKey: z.string(),
  redirect: z.string(),
});

export const createPhoneSchema = (locales: OrganizationWebAndSocialLocales) =>
  z.string().regex(
    // Escape in following regex -> See: https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/pattern#overview
    // eslint-disable-next-line no-useless-escape
    /^$|^(\+?[0-9 \-\(\)]{3,}\/?[0-9 \-\(\)]{4,})$/,
    locales.webAndSocialSchemas.validation.phone.regex
  );

function addProtocolToUrl(url: string) {
  if (url.search(/^https?:\/\//) === -1) {
    url = `https://${url}`;
  }
  return url;
}

export const createWebsiteSchema = (locales: OrganizationWebAndSocialLocales) =>
  z
    .string()
    .regex(
      // Escape in following regex -> See: https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/pattern#overview
      // eslint-disable-next-line no-useless-escape
      /^(https:\/\/)(www\.)?[\-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9\(\)]{1,9}\b([\-a-zA-Z0-9\(\)@:%_+.~#?&\/\/=]*)/gi,
      {
        message: locales.webAndSocialSchemas.validation.website.regex,
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

export const createFacebookSchema = (
  locales: OrganizationWebAndSocialLocales
) =>
  z
    .string()
    .regex(/^(https:\/\/)([a-z0-9]+\.)?facebook.com\/.+$|^$/, {
      message: locales.webAndSocialSchemas.validation.facebook.regex,
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

export const createLinkedinSchema = (
  locales: OrganizationWebAndSocialLocales
) =>
  z
    .string()
    .regex(/^(https:\/\/)([a-z0-9]+\.)?linkedin.com\/.+$|^$/, {
      message: locales.webAndSocialSchemas.validation.linkedin.regex,
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

export const createXingSchema = (locales: OrganizationWebAndSocialLocales) =>
  z
    .string()
    .regex(/^(https:\/\/)([a-z0-9]+\.)?xing.com\/.+$|^$/, {
      message: locales.webAndSocialSchemas.validation.xing.regex,
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

export const createTwitterSchema = (locales: OrganizationWebAndSocialLocales) =>
  z
    .string()
    .regex(/^(https:\/\/)([a-z0-9]+\.)?(twitter|x).com\/.+$|^$/, {
      message: locales.webAndSocialSchemas.validation.twitter.regex,
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

export const createMastodonSchema = (
  locales: OrganizationWebAndSocialLocales
) => createWebsiteSchema(locales);

export const createBlueskySchema = (locales: OrganizationWebAndSocialLocales) =>
  z
    .string()
    .regex(/^(https:\/\/)([a-z0-9]+\.)?bsky.app\/.+$|^$/, {
      message: locales.webAndSocialSchemas.validation.bluesky.regex,
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

export const createTiktokSchema = (locales: OrganizationWebAndSocialLocales) =>
  z
    .string()
    .regex(/^(https:\/\/)([a-z0-9]+\.)?tiktok.com\/.+$|^$/, {
      message: locales.webAndSocialSchemas.validation.tiktok.regex,
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

export const createInstagramSchema = (
  locales: OrganizationWebAndSocialLocales
) =>
  z
    .string()
    .regex(/^(https:\/\/)([a-z0-9]+\.)?instagram.com\/.+$|^$/, {
      message: locales.webAndSocialSchemas.validation.instagram.regex,
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

export const createYoutubeSchema = (locales: OrganizationWebAndSocialLocales) =>
  z
    .string()
    .regex(/^(https:\/\/)([a-z0-9]+\.)?youtube.com\/.+$|^$/, {
      message: locales.webAndSocialSchemas.validation.youtube.regex,
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

export const createYoutubeEmbedSchema = (t: TFunction) =>
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
            throw new Error(
              locales.webAndSocialSchemas.validation.youtubeEmbed.urlParsing
            );
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
            message: locales.webAndSocialSchemas.validation.youtubeEmbed.regex,
          }
        )
        .nullable()
    );
