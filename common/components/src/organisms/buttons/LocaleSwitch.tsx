import { useLocation } from "@remix-run/react";
import { supportedCookieLanguages } from "~/i18n.shared";
import { extendSearchParams } from "~/lib/utils/searchParams";
import { type ArrayElement } from "~/lib/utils/types";
import {
  TextButton,
  type TextButtonVariants,
} from "../../molecules/TextButton";

export function LocaleSwitch(props: {
  variant?: TextButtonVariants;
  currentLanguage: ArrayElement<typeof supportedCookieLanguages>;
}) {
  const variant = props.variant || "primary";
  const location = useLocation();

  return (
    <ul className="mv-flex mv-items-center">
      {supportedCookieLanguages.map((language: string, index: number) => {
        const newSearchParams = extendSearchParams(
          new URLSearchParams(location.search),
          {
            addOrReplace: {
              lng: language,
            },
          }
        );
        return (
          <li key={language} className="mv-flex mv-items-center">
            {index > 0 ? <span className="mv-px-2">|</span> : ""}
            <span>
              {/* TODO: I want preventScrollReset here but the TextButton cannot be used with a remix Link wrapped inside. */}
              <TextButton
                as="a"
                href={`?${newSearchParams.toString()}`}
                variant={variant}
                weight={language === props.currentLanguage ? "normal" : "thin"}
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
