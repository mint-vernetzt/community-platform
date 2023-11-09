import { z } from "zod";
import { subject, uploadKey } from "~/routes/upload/utils.server";

export const fileUploadSchema = z.object({
  subject: subject,
  slug: z.string().min(1),
  uploadKey: uploadKey,
  redirect: z.string(),
});

export const phoneSchema = z
  .string()
  .regex(
    /^$|^(\+?[0-9\s-()]{3,}\/?[0-9\s-()]{4,})$/,
    "Bitte gib eine gültige Telefonnummer ein (Mindestens 7 Ziffern, Erlaubte Zeichen: Leerzeichen, +, -, (, ))."
  );

function addProtocolToUrl(url: string) {
  let validUrl = url.trim();
  if (validUrl !== "" && validUrl.search(/^https?:\/\//) === -1) {
    validUrl = `https://${validUrl}`;
  }
  return validUrl;
}

export const websiteSchema = z
  .string()
  .regex(
    /(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/gi,
    {
      message: "Deine Eingabe entspricht nicht dem Format einer Website URL.",
    }
  )
  .optional()
  .transform((value) => {
    if (value === undefined) {
      return null;
    }
    return addProtocolToUrl(value);
  });

export const facebookSchema = z
  .string()
  .regex(/(https?:\/\/)?(.*\.)?facebook.com\/.+$|^$/, {
    message:
      "Deine Eingabe entspricht nicht dem Format einer Facebook Seite (facebook.com/...).",
  })
  .optional()
  .transform((value) => {
    if (value === undefined) {
      return null;
    }
    return addProtocolToUrl(value);
  });

export const linkedinSchema = z
  .string()
  .regex(/(https?:\/\/)?(.*\.)?linkedin.com\/.+$|^$/, {
    message:
      "Deine Eingabe entspricht nicht dem Format einer LinkedIn Seite (linkedin.com/...).",
  })
  .optional()
  .transform((value) => {
    if (value === undefined) {
      return null;
    }
    return addProtocolToUrl(value);
  });

export const xingSchema = z
  .string()
  .regex(/(https?:\/\/)?(.*\.)?xing.com\/.+$|^$/, {
    message:
      "Deine Eingabe entspricht nicht dem Format einer Xing Seite (xing.com/...).",
  })
  .optional()
  .transform((value) => {
    if (value === undefined) {
      return null;
    }
    return addProtocolToUrl(value);
  });

export const twitterSchema = z
  .string()
  .regex(/(https?:\/\/)?(.*\.)?twitter.com\/.+$|^$/, {
    message:
      "Deine Eingabe entspricht nicht dem Format einer Twitter Seite (twitter.com/...).",
  })
  .optional()
  .transform((value) => {
    if (value === undefined) {
      return null;
    }
    return addProtocolToUrl(value);
  });

export const mastodonSchema = z
  .string()
  .regex(
    /(https?:\/\/)?(.*\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\/@.+$|^$/,
    {
      message:
        "Deine Eingabe entspricht nicht dem Format einer Mastodon Seite.",
    }
  )
  .optional()
  .transform((value) => {
    if (value === undefined) {
      return null;
    }
    return addProtocolToUrl(value);
  });

export const blueskySchema = z
  .string()
  .regex(/(https?:\/\/)?(.*\.)?bsky.app\/.+$|^$/, {
    message:
      "Deine Eingabe entspricht nicht dem Format einer Blue Sky Seite (bsky.app/...).",
  })
  .optional()
  .transform((value) => {
    if (value === undefined) {
      return null;
    }
    return addProtocolToUrl(value);
  });

export const tiktokSchema = z
  .string()
  .regex(/(https?:\/\/)?(.*\.)?tiktok.com\/@.+$|^$/, {
    message:
      "Deine Eingabe entspricht nicht dem Format einer TikTok Seite (tiktok.com/@...).",
  })
  .optional()
  .transform((value) => {
    if (value === undefined) {
      return null;
    }
    return addProtocolToUrl(value);
  });

export const instagramSchema = z
  .string()
  .regex(/(https?:\/\/)?(.*\.)?instagram.com\/.+$|^$/, {
    message:
      "Deine Eingabe entspricht nicht dem Format einer Instagram Seite (instagram.com/...).",
  })
  .optional()
  .transform((value) => {
    if (value === undefined) {
      return null;
    }
    return addProtocolToUrl(value);
  });

export const youtubeSchema = z
  .string()
  .regex(/(https?:\/\/)?(.*\.)?youtube.com\/.+$|^$/, {
    message:
      "Deine Eingabe entspricht nicht dem Format einer Youtube Seite (youtube.com/...).",
  })
  .optional()
  .transform((value) => {
    if (value === undefined) {
      return null;
    }
    return addProtocolToUrl(value);
  });

export const youtubeEmbedSchema = z
  .string()
  .regex(
    /(?:https?:\/\/)?(?:www\.)?(?:youtube(?:-nocookie)?\.com\/(?:embed\/))([a-zA-Z0-9_-]{6,11})/,
    {
      message:
        "Deine Eingabe entspricht nicht dem Format einer Youtube Embed URL (youtube.com/embed/... oder youtube-nocookie.com/embed).",
    }
  )
  .optional()
  .transform((value) => {
    if (value === undefined) {
      return null;
    }
    return addProtocolToUrl(value);
  });
