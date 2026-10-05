import { useFetcher } from "react-router";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_COOKIE_NAME,
  SUPPORTED_COOKIE_LANGUAGES,
} from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { type RootLocales } from "~/root.server";
import {
  TextButton,
  type TextButtonVariants,
} from "../../molecules/TextButton";

export function LocaleSwitch(props: {
  variant?: TextButtonVariants;
  currentLanguage: ArrayElement<typeof SUPPORTED_COOKIE_LANGUAGES>;
  locales?: RootLocales;
}) {
  const variant = props.variant || "primary";
  const fetcher = useFetcher();

  return (
    <ul className="flex items-center">
      {SUPPORTED_COOKIE_LANGUAGES.map((language: string, index: number) => {
        const typedLanguage = language as ArrayElement<
          typeof SUPPORTED_COOKIE_LANGUAGES
        >;
        return (
          <li key={typedLanguage} className="flex items-center">
            {index > 0 ? <span className="px-2">|</span> : ""}
            <span>
              <fetcher.Form
                id={`locale-switch-form-${typedLanguage}`}
                method="post"
                action="/switch-locale"
                hidden
                preventScrollReset
              />
              <TextButton
                type="submit"
                form={`locale-switch-form-${typedLanguage}`}
                name={LANGUAGE_COOKIE_NAME}
                value={typedLanguage}
                variant={variant}
                weight={
                  typedLanguage === props.currentLanguage ? "normal" : "thin"
                }
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
