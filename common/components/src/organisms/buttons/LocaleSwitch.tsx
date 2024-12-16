import { Link, useLocation } from "@remix-run/react";
import { extendSearchParams } from "~/lib/utils/searchParams";
import { TextButton } from "../../molecules/TextButton";
import { type TextButtonVariants } from "../../molecules/TextButton";
import { supportedCookieLanguages } from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";

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
              <Link to={`?${newSearchParams.toString()}`} preventScrollReset>
                <TextButton
                  variant={variant}
                  weight={
                    language === props.currentLanguage ? "normal" : "thin"
                  }
                >
                  {language.toUpperCase()}
                </TextButton>
              </Link>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
