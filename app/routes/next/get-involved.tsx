import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { createAuthClient } from "~/auth.server";
import { detectLanguage } from "~/i18n.server";
import { languageModuleMap } from "~/locales/.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;

  const { authClient } = createAuthClient(request);
  await checkFeatureAbilitiesOrThrow(authClient, ["next_getinvolved"]);

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["next/get-involved"];

  return { locales };
};

export default function GetInvolved() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales } = loaderData;

  return (
    <>
      <section className="pt-16 pb-10 @md:pt-20 @md:pb-12.5 @lg:pt-24 @lg:pb-15 relative">
        <div className="w-full mx-auto px-4 @sm:max-w-sm @md:max-w-md @lg:max-w-lg @xl:max-w-xl @xl:px-6 @2xl:max-w-2xl relative">
          <h1>{locales.content.headline}</h1>
          <p>{locales.content.info}</p>
        </div>
      </section>
    </>
  );
}
