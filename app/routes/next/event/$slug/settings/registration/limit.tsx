import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { detectLanguage } from "~/i18n.server";
import { invariantResponse } from "~/lib/utils/response";
import { languageModuleMap } from "~/locales/.server";

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;
  const { slug } = params;

  invariantResponse(typeof slug === "string", "slug is not defined", {
    status: 400,
  });

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/settings/registration/limit"];

  return { locales };
}

function RegistrationLimit() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales } = loaderData;
  return (
    <>
      <h3>{locales.route.limit.title}</h3>
      <h3>{locales.route.waitingList.title}</h3>
    </>
  );
}

export default RegistrationLimit;
