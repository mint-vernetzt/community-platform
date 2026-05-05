import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { invariantResponse } from "~/lib/utils/response";
import { languageModuleMap } from "~/locales/.server";
import { detectLanguage } from "~/root.server";

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;
  invariantResponse(typeof params.slug === "string", "slug is not defined", {
    status: 400,
  });

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/settings/details/background"];

  return { locales };
}

function Background() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales } = loaderData;

  return (
    <>
      <div>
        <h3 className="text-primary text-2xl font-bold leading-6.5 mt-2 mb-1">
          {locales.route.title}
        </h3>
      </div>
    </>
  );
}

export default Background;
