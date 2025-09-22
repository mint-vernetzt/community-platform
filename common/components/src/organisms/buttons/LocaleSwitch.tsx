import { useLocation } from "react-router";
import { DEFAULT_LANGUAGE, SUPPORTED_COOKIE_LANGUAGES } from "~/i18n.shared";
import { extendSearchParams } from "~/lib/utils/searchParams";
import { type ArrayElement } from "~/lib/utils/types";
import {
  TextButton,
  type TextButtonVariants,
} from "../../molecules/TextButton";
import { type RootLocales } from "~/root.server";

export function LocaleSwitch(props: {
  variant?: TextButtonVariants;
  currentLanguage: ArrayElement<typeof SUPPORTED_COOKIE_LANGUAGES>;
  locales?: RootLocales;
}) {
  const variant = props.variant || "primary";
  const location = useLocation();

  return (
    <ul className="flex items-center">
      {SUPPORTED_COOKIE_LANGUAGES.map((language: string, index: number) => {
        const newSearchParams = extendSearchParams(
          new URLSearchParams(location.search),
          {
            addOrReplace: {
              lng: language,
            },
          }
        );
        const typedLanguage = language as ArrayElement<
          typeof SUPPORTED_COOKIE_LANGUAGES
        >;
        return (
          <li key={typedLanguage} className="flex items-center">
            {index > 0 ? <span className="px-2">|</span> : ""}
            <span>
              <TextButton
                as="link"
                to={`?${newSearchParams.toString()}`}
                variant={variant}
                weight={
                  typedLanguage === props.currentLanguage ? "normal" : "thin"
                }
                preventScrollReset
                aria-label={
                  props.locales !== undefined
                    ? props.locales.route.root.menu.languageSwitch[
                        typedLanguage
                      ]
                    : typedLanguage === "de" && DEFAULT_LANGUAGE === "de"
                    ? "Sprache wechseln zu Deutsch"
                    : typedLanguage === "en" && DEFAULT_LANGUAGE === "de"
                    ? "Sprache wechseln zu Englisch"
                    : typedLanguage === "de"
                    ? "Switch language to German"
                    : typedLanguage === "en"
                    ? "Switch language to English"
                    : ""
                }
              >
                {language.toUpperCase()}
              </TextButton>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
