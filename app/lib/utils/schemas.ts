import { z } from "zod";
import { type TFunction } from "i18next";

const i18nNS = "utils/schemas";

export const fileUploadSchema = z.object({
  subject: z.string(),
  slug: z.string().min(1),
  uploadKey: z.string(),
  redirect: z.string(),
});

export const createPhoneSchema = (t: TFunction) =>
  z
    .string()
    .regex(
      /^$|^(\+?[0-9\s-()]{3,}\/?[0-9\s-()]{4,})$/,
      t("validation.phone.regex", { ns: i18nNS })
    );

function addProtocolToUrl(url: string) {
  let validUrl = url.trim();
  if (validUrl !== "" && validUrl.search(/^https?:\/\//) === -1) {
    validUrl = `https://${validUrl}`;
  }
  return validUrl;
}

export const createWebsiteSchema = (t: TFunction) =>
  z
    .string()
    .regex(
      /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,9}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/gi,
      {
        message: t("validation.website.regex", { ns: i18nNS }),
      }
    )
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return null;
      }
      return addProtocolToUrl(value);
    });

export const createFacebookSchema = (t: TFunction) =>
  z
    .string()
    .regex(/^(https?:\/\/)?([a-z0-9]+\.)?facebook.com\/.+$|^$/, {
      message: t("validation.facebook.regex", { ns: i18nNS }),
    })
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return null;
      }
      return addProtocolToUrl(value);
    });

export const createLinkedinSchema = (t: TFunction) =>
  z
    .string()
    .regex(/^(https?:\/\/)?([a-z0-9]+\.)?linkedin.com\/.+$|^$/, {
      message: t("validation.linkedin.regex", { ns: i18nNS }),
    })
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return null;
      }
      return addProtocolToUrl(value);
    });

export const createXingSchema = (t: TFunction) =>
  z
    .string()
    .regex(/^(https?:\/\/)?([a-z0-9]+\.)?xing.com\/.+$|^$/, {
      message: t("validation.xing.regex", { ns: i18nNS }),
    })
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return null;
      }
      return addProtocolToUrl(value);
    });

export const createTwitterSchema = (t: TFunction) =>
  z
    .string()
    .regex(/^(https?:\/\/)?([a-z0-9]+\.)?twitter.com\/.+$|^$/, {
      message: t("validation.twitter.regex", { ns: i18nNS }),
    })
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return null;
      }
      return addProtocolToUrl(value);
    });

export const createMastodonSchema = (t: TFunction) =>
  z
    .string()
    .regex(
      /^(https?:\/\/)?([a-z0-9]+\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\/@.+$|^$/,
      {
        message: t("validation.mastodon.regex", { ns: i18nNS }),
      }
    )
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return null;
      }
      return addProtocolToUrl(value);
    });

export const createBlueskySchema = (t: TFunction) =>
  z
    .string()
    .regex(/^(https?:\/\/)?([a-z0-9]+\.)?bsky.app\/.+$|^$/, {
      message: t("validation.bluesky.regex", { ns: i18nNS }),
    })
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return null;
      }
      return addProtocolToUrl(value);
    });

export const createTiktokSchema = (t: TFunction) =>
  z
    .string()
    .regex(/^(https?:\/\/)?([a-z0-9]+\.)?tiktok.com\/@.+$|^$/, {
      message: t("validation.tiktok.regex", { ns: i18nNS }),
    })
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return null;
      }
      return addProtocolToUrl(value);
    });

export const createInstagramSchema = (t: TFunction) =>
  z
    .string()
    .regex(/^(https?:\/\/)?([a-z0-9]+\.)?instagram.com\/.+$|^$/, {
      message: t("validation.instagram.regex", { ns: i18nNS }),
    })
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return null;
      }
      return addProtocolToUrl(value);
    });

export const createYoutubeSchema = (t: TFunction) =>
  z
    .string()
    .regex(/^(https?:\/\/)?([a-z0-9]+\.)?youtube.com\/.+$|^$/, {
      message: t("validation.youtube.regex", { ns: i18nNS }),
    })
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return null;
      }
      return addProtocolToUrl(value);
    });

export const createYoutubeEmbedSchema = (t: TFunction) =>
  z
    .string()
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return null;
      }
      let embedLink = value;
      // IFrame: <iframe ... src="https://www.youtube.com/embed/<videoCode>?si=k6KomOnFdKtnSGGP" ... </iframe>
      if (value.startsWith("<iframe")) {
        embedLink = value.split('src="')[1].split('" ')[0];
      } else {
        let url;
        let videoCodeParam;
        const enhancedValue = addProtocolToUrl(value);
        try {
          url = new URL(enhancedValue);
        } catch (e: unknown) {
          console.error(e);
          if ((e as Error).message !== undefined) {
            throw new Error((e as Error).message);
          } else {
            throw new Error(
              t("validation.youtubeEmbed.urlParsing", { ns: i18nNS })
            );
          }
        }
        // Watch Link: https://www.youtube.com/watch?v=<videoCode>
        if (value.includes("youtube.com/watch")) {
          videoCodeParam = url.searchParams.get("v");
          url.searchParams.delete("v");
          embedLink = `https://www.youtube.com/embed/${videoCodeParam}${url.search}`;
        }
        // Share Link: https://www.youtu.be/<videoCode> || https://www.youtube.com/live/<videoCode>
        if (value.includes("youtu.be") || value.includes("youtube.com/live")) {
          if (value.includes("youtu.be")) {
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
          value.includes("youtube.com/embed") ||
          value.includes("youtube-nocookie.com/embed")
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
            message: t("validation.youtubeEmbed.regex", { ns: i18nNS }),
          }
        )
        .nullable()
    );
