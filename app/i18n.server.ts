import { createCookie } from "@remix-run/node";
import { z } from "zod";
import {
  lngCookieName,
  defaultLanguage,
  supportedCookieLanguages,
  lngCookieMaxAge,
} from "./i18n";

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

export function detectLanguage(request: Request) {
  const cookie = request.headers.get("Cookie") ?? "";
  const splittedCookie = cookie.split("=");
  if (splittedCookie.length !== 2) {
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
  const cookieLng = splittedCookie[1];
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
