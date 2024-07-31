import { useTranslation } from "react-i18next";
import { TextButton } from "../../molecules";
import { type TextButtonVariants } from "../../molecules/TextButton";

export default function LocaleSwitch(props: { variant?: TextButtonVariants }) {
  const variant = props.variant || "primary";
  const { i18n } = useTranslation();

  let languages = ["de", "en"];
  if (i18n.options.supportedLngs) {
    languages = i18n.options.supportedLngs.filter((l) => l !== "cimode");
  }

  return (
    <ul className="mv-flex mv-items-center">
      {languages.map((l: string, cnt: number) => (
        <li key={cnt} className="mv-flex mv-items-center">
          {cnt > 0 ? <span className="mx-2">|</span> : ""}
          <span>
            <TextButton
              variant={variant}
              weight={l === i18n.language ? "normal" : "thin"}
              onClick={() => i18n.changeLanguage(l)}
            >
              {l.toUpperCase()}
            </TextButton>
          </span>
        </li>
      ))}
    </ul>
  );
}
