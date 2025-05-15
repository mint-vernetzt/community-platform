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
    <section className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl mv-mt-8 @md:mv-mt-10 @lg:mv-mt-20 mv-text-center">
      <h1>{locales.content.headline}</h1>
      <p className="mv-mt-4">{locales.content.info}</p>
    </section>
  );
}
