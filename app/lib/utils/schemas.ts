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
          throw new Error("Unknown error during url parsing.");
        }
      }
      // Watch Link: https://www.youtube.com/watch?v=<videoCode>
      if (value.includes("youtube.com/watch")) {
        videoCodeParam = url.searchParams.get("v");
        url.searchParams.delete("v");
        embedLink = `https://www.youtube.com/embed/${videoCodeParam}${url.search}`;
      }
      // Share Link: https://www.youtu.be/<videoCode>
      if (value.includes("youtu.be")) {
        videoCodeParam = url.pathname;
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
        // TODO: Question: Should we just allow a videoCode of 6 to 11 digits? Is this to restrictive?
        // /(?:https?:\/\/)?(?:www\.)?(?:youtube(?:-nocookie)?\.com\/(?:embed\/))([a-zA-Z0-9_-]{6,11})/,

        // This is less restrictive and allows additional search params
        /(?:https?:\/\/)?(?:www\.)?(?:youtube(?:-nocookie)?\.com\/(?:embed\/)).+/,
        {
          message:
            'Deine Eingabe entspricht nicht dem Format einer Youtube-Watch-URL, einer Youtube-Embed-URL oder eines YouTube-<iframe> (youtube.com/watch?v=, youtube.com/embed/, youtube-nocookie.com/embed/, youtu.be/, <iframe ... src="youtube.com/embed/... ></iframe>).',
        }
      )
      .nullable()
  );
