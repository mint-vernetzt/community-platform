import type { LoaderFunctionArgs } from "react-router";
import { detectLanguage } from "~/i18n.server";
import { languageModuleMap } from "~/locales/.server";

export async function loader(args: LoaderFunctionArgs) {
  const { request } = args;

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/settings/documents"];

  return { locales };
}

export default function Documents() {
  return <>Documents</>;
}
