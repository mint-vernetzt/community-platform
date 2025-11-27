import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { detectLanguage } from "~/i18n.server";
import { languageModuleMap } from "~/locales/.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/settings/documents"];

  return { locales };
};

export default function Documents() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales } = loaderData;

  return <>Documents</>;
}
