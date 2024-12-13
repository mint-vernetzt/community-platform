import { Link, useLocation } from "@remix-run/react";
import { extendSearchParams } from "~/lib/utils/searchParams";
import { TextButton } from "../../molecules";
import { type TextButtonVariants } from "../../molecules/TextButton";
import {
  lngCookieMaxAge,
  lngCookieName,
  supportedCookieLanguages,
} from "~/i18n";
import { type ArrayElement } from "~/lib/utils/types";
import Cookies from "js-cookie";

export default function LocaleSwitch(props: {
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
              <Link
                to={`?${newSearchParams.toString()}`}
                onClick={() => {
                  Cookies.set(lngCookieName, language, {
                    sameSite: "Lax",
                    expires: new Date(Date.now() + lngCookieMaxAge * 1000),
                  });
                }}
                preventScrollReset
              >
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
