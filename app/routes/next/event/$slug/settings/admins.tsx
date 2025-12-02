import type { LoaderFunctionArgs } from "react-router";
import { detectLanguage } from "~/i18n.server";
import { languageModuleMap } from "~/locales/.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/settings/admins"];

  return { locales };
};

export default function Admins() {
  return <>Admins</>;
}
