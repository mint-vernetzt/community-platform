import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { detectLanguage } from "~/i18n.server";
import { invariantResponse } from "~/lib/utils/response";
import { languageModuleMap } from "~/locales/.server";

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;
  invariantResponse(typeof params.slug === "string", "slug is not defined", {
    status: 400,
  });

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language][
      "next/event/$slug/settings/responsible-orgs/add"
    ];

  return {
    locales,
  };
}

function AddResponsibleOrg() {
  const loaderData = useLoaderData<typeof loader>();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { locales } = loaderData;

  return <></>;
}

export default AddResponsibleOrg;
