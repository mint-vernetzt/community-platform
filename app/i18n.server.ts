import { createCookie } from "react-router";
import { z } from "zod";
import {
  lngCookieName,
  defaultLanguage,
  supportedCookieLanguages,
  lngCookieMaxAge,
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

export const localeCookie = createCookie(lngCookieName, {
  path: "/",
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  httpOnly: true,
  // 1 year
  maxAge: lngCookieMaxAge,
});

const localeCookieSchema = z.enum(supportedCookieLanguages);

const localeHeaderSchema = z
  .enum(supportedHeaderLanguages)
  .transform((value) => {
    if (value.startsWith("de")) {
      return "de" as const;
    }
    if (value.startsWith("en")) {
      return "en" as const;
    }
    return defaultLanguage;
  });

export async function detectLanguage(request: Request) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const lngSearchParam = searchParams.get("lng");
  if (lngSearchParam !== null) {
    invariantResponse(
      supportedCookieLanguages.includes(
        lngSearchParam as ArrayElement<typeof supportedCookieLanguages>
      ),
      "Invalid language",
      {
        status: 400,
      }
    );
    return lngSearchParam as ArrayElement<typeof supportedCookieLanguages>;
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
        return defaultLanguage;
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
        return defaultLanguage;
      }
      return lng;
    }
    return lng;
  }
}

export function getSlugFromLocaleThatContainsWord(options: {
  language: ArrayElement<typeof supportedCookieLanguages>;
  locales: keyof (typeof languageModuleMap)[ArrayElement<
    typeof supportedCookieLanguages
  >];
  word: string;
}) {
  const { language, locales, word } = options;
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
