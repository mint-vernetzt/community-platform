import { type LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { detectLanguage } from "~/i18n.server";
import { languageModuleMap } from "~/locales/.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;
  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["goodbye"];
  return { locales };
};

export default function GoodBye() {
  const { locales } = useLoaderData<typeof loader>();

  return (
    <section className="w-full mx-auto px-4 @sm:max-w-screen-container-sm @md:max-w-screen-container-md @lg:max-w-screen-container-lg @xl:max-w-screen-container-xl @xl:px-6 @2xl:max-w-screen-container-2xl mt-8 @md:mt-10 @lg:mt-20 text-center">
      <h1>{locales.content.headline}</h1>
      <p className="mt-4">{locales.content.info}</p>
    </section>
  );
}
