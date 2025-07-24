import { createCookie } from "react-router";
import { z } from "zod";
import {
  LANGUAGE_COOKIE_NAME,
  DEFAULT_LANGUAGE,
  SUPPORTED_COOKIE_LANGUAGES,
  LANGUAGE_COOKIE_MAX_AGE,
} from "./i18n.shared";
import { type ArrayElement } from "./lib/utils/types";
import { invariantResponse } from "./lib/utils/response";
import { languageModuleMap } from "./locales/.server";

const supportedHeaderLanguages = [
  "de",
  "de-at",
  "de-de",
  "de-li",
  "de-lu",
  "de-ch",
  "en",
  "en-au",
  "en-bz",
  "en-ca",
  "en-ie",
  "en-jm",
  "en-nz",
  "en-ph",
  "en-za",
  "en-tt",
  "en-gb",
  "en-us",
  "en-zw",
] as const;

export const localeCookie = createCookie(LANGUAGE_COOKIE_NAME, {
  path: "/",
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  httpOnly: true,
  // 1 year
  maxAge: LANGUAGE_COOKIE_MAX_AGE,
});

const localeCookieSchema = z.enum(SUPPORTED_COOKIE_LANGUAGES);

const localeHeaderSchema = z
  .enum(supportedHeaderLanguages)
  .transform((value) => {
    if (value.startsWith("de")) {
      return "de" as const;
    }
    if (value.startsWith("en")) {
      return "en" as const;
    }
    return DEFAULT_LANGUAGE;
  });

export async function detectLanguage(request: Request) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const lngSearchParam = searchParams.get("lng");
  if (lngSearchParam !== null) {
    invariantResponse(
      SUPPORTED_COOKIE_LANGUAGES.includes(
        lngSearchParam as ArrayElement<typeof SUPPORTED_COOKIE_LANGUAGES>
      ),
      "Invalid language",
      {
        status: 400,
      }
    );
    return lngSearchParam as ArrayElement<typeof SUPPORTED_COOKIE_LANGUAGES>;
  } else {
    const cookieHeader = request.headers.get("Cookie");
    // TODO: fix type issue
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cookieLng = (await localeCookie.parse(cookieHeader)) as null | any;
    if (cookieLng === null) {
      const acceptLanguageHeaderLng =
        request.headers.get("Accept-Language") ?? "";
      const preferredLanguage = acceptLanguageHeaderLng.split(",")[0];
      let lng;
      try {
        lng = localeHeaderSchema.parse(preferredLanguage.toLowerCase());
      } catch {
        return DEFAULT_LANGUAGE;
      }
      return lng;
    }
    let lng;
    try {
      lng = localeCookieSchema.parse(cookieLng);
    } catch {
      const acceptLanguageHeaderLng =
        request.headers.get("Accept-Language") ?? "";
      let lng;
      try {
        lng = localeHeaderSchema.parse(acceptLanguageHeaderLng.toLowerCase());
      } catch {
        return DEFAULT_LANGUAGE;
      }
      return lng;
    }
    return lng;
  }
}

export function getSlugFromLocaleThatContainsWord(options: {
  language: ArrayElement<typeof SUPPORTED_COOKIE_LANGUAGES>;
  locales: keyof (typeof languageModuleMap)[ArrayElement<
    typeof SUPPORTED_COOKIE_LANGUAGES
  >];
  word: string;
}) {
  const { language, locales, word } = options;

  if (word.length === 0) {
    return;
  }

  const slugs = Object.entries(languageModuleMap[language][locales]).find(
    ([, value]) => {
      if (
        typeof value !== "object" &&
        "title" in value === false &&
        typeof value.title !== "string"
      ) {
        return false;
      }
      return (value.title as string).toLowerCase().includes(word.toLowerCase());
    }
  );

  if (typeof slugs === "undefined") {
    return;
  }
  return slugs[0];
}
