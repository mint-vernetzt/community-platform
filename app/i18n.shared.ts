export const DEFAULT_LANGUAGE = "de" as const;

export const SUPPORTED_COOKIE_LANGUAGES = ["de", "en"] as const;

export const LANGUAGE_COOKIE_NAME = "lng" as const;
// 1 year
export const LANGUAGE_COOKIE_MAX_AGE = 31540000 as const;

export function getLocaleFromSlug(
  slug: string,
  locales: Record<string, { title: string }>
) {
  let title;
  if (slug in locales) {
    title = locales[slug].title;
  } else {
    console.error(`${slug} not found in locales $`);
    title = slug;
  }
  return title;
}
