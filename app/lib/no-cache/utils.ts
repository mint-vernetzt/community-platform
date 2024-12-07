import { seed } from "./seed";

export const localesUrl = (lng: string, ns: string): string =>
  process.env.NODE_ENV === "development"
    ? `/public/${lng}/${ns}.json?url`
    : `/public/${lng}/${ns}.json?url&seed=${seed}`;

export const requestOptions = () => {
  return process.env.NODE_ENV === "development" ? { cache: "no-store" } : {};
};
