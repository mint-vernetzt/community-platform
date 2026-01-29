import { Link, type LoaderFunctionArgs, useLoaderData } from "react-router";
import { detectLanguage } from "~/i18n.server";
import { languageModuleMap } from "~/locales/.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["imprint"];
  return {
    locales,
  };
};

export default function Imprint() {
  const { locales } = useLoaderData<typeof loader>();

  return (
    <section className="w-full mx-auto px-4 @sm:max-w-sm @md:max-w-md @lg:max-w-lg @xl:max-w-xl @xl:px-6 @2xl:max-w-2xl my-8 @md:my-10 @lg:my-20">
      <h1>{locales.title}</h1>
      <p className="mb-2">{locales.project.title}</p>
      <ul className="mb-4">
        {locales.project.members.split(";").map((s: string, index) => (
          <li key={index}>- {s.trim()}</li>
        ))}
      </ul>
      <p className="mb-2">{locales.serviceProvider.intro}</p>
      <p>{locales.serviceProvider.name}</p>
      <p>{locales.serviceProvider.address1}</p>
      <p>{locales.serviceProvider.address2}</p>
      <p className="mb-4">{locales.serviceProvider.address3}</p>
      <h6 className="mb-2">{locales.represented.title}</h6>
      <p>Gregor Frankenstein-von der Beeck</p>
      <p>Guido Lohnherr</p>
      <p>Tel.: +49(0)211-75707-910</p>
      <p>Fax: +49(0)211-987300</p>
      <p>
        {locales.represented.email}{" "}
        <Link
          className="text-primary hover:underline"
          to="mailto:info@matrix-ggmbh.de"
          target="_blank"
          rel="noreferrer noopener"
        >
          info@matrix-ggmbh.de
        </Link>
      </p>
      <p>{locales.represented.vat} DE 329043660</p>
      <p>{locales.represented.register} HRB 33341</p>
      <p className="mb-2">{locales.represented.appointed}</p>
      <p>{locales.represented.responsible}</p>
    </section>
  );
}
