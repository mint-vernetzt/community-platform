import { useLocation } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { extendSearchParams } from "~/lib/utils/searchParams";
import { TextButton } from "../../molecules";
import { type TextButtonVariants } from "../../molecules/TextButton";

export default function LocaleSwitch(props: { variant?: TextButtonVariants }) {
  const variant = props.variant || "primary";
  const { i18n } = useTranslation();
  const location = useLocation();

  let languages = ["de", "en"];
  if (i18n.options.supportedLngs) {
    languages = i18n.options.supportedLngs.filter((l) => l !== "cimode");
  }

  return (
    <ul className="mv-flex mv-items-center">
      {languages.map((l: string, cnt: number) => {
        const newSearchParams = extendSearchParams(
          new URLSearchParams(location.search),
          {
            addOrReplace: {
              lng: l,
            },
          }
        );
        return (
          <li key={cnt} className="mv-flex mv-items-center">
            {cnt > 0 ? <span className="mv-px-2">|</span> : ""}
            <span>
              <TextButton
                as="a"
                href={`?${newSearchParams.toString()}`}
                variant={variant}
                weight={l === i18n.language ? "normal" : "thin"}
                onClick={(event: any) => {
                  event.preventDefault();
                  event.stopPropagation();
                  i18n.changeLanguage(l);
                }}
              >
                {l.toUpperCase()}
              </TextButton>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
