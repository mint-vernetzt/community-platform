import { z } from "zod";
import { subject, uploadKey } from "~/routes/upload/utils.server";

export const fileUploadSchema = z.object({
  subject: subject,
  slug: z.string().min(1),
  uploadKey: uploadKey,
  redirect: z.string(),
});

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
    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/gi,
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
  .regex(/(https?:\/\/)?(.*\.)?mastodon.social\/.+$|^$/, {
    message:
      "Deine Eingabe entspricht nicht dem Format einer Mastodon Seite (mastodon.social/...).",
  })
  .optional()
  .transform((value) => {
    if (value === undefined) {
      return null;
    }
    return addProtocolToUrl(value);
  });

export const blueSkySchema = z
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
