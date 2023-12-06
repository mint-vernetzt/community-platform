import { seed } from "./seed";

export const localesUrl = (lng: string, ns: string): string =>
  process.env.NODE_ENV === "development"
    ? `/locales/${lng}/${ns}.json`
    : `/locales/${lng}/${ns}.json?seed=${seed}`;

export const requestOptions = () => {
  return process.env.NODE_ENV === "development" ? { cache: "no-store" } : {};
};
