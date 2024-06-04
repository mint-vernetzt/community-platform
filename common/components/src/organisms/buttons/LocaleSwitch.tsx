import { useTranslation } from "react-i18next";
import { TextButton } from "../../molecules";
import { type TextButtonVariants } from "../../molecules/TextButton";

export default function LocaleSwitch(props: { variant?: TextButtonVariants }) {
  const variant = props.variant || "primary";
  const { i18n } = useTranslation();
  const languages = i18n.options.supportedLngs.filter(
    (l: string): boolean => l !== "cimode"
  );

  return (
    <ul className="flex items-center">
      {languages.map((l: string, cnt: number) => (
        <li key={cnt} className="inline-flex">
          {cnt > 0 ? <span className="mx-2">|</span> : ""}
          <TextButton
            variant={variant}
            weight={l === i18n.language ? "normal" : "thin"}
            onClick={() => i18n.changeLanguage(l)}
          >
            {l.toUpperCase()}
          </TextButton>
        </li>
      ))}
    </ul>
  );
}
