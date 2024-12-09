import { useTranslation } from "react-i18next";

const i18nNS = ["routes-imprint"] as const;
export const handle = {
  i18n: i18nNS,
};

export default function Imprint() {
  const { t } = useTranslation(i18nNS);

  return (
    <section className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl my-8 @md:mv-my-10 @lg:mv-my-20">
      <h1>{t("title")}</h1>
      <p className="mb-2">{t("project.title")}</p>
      <ul className="mb-4">
        {t("project.members")
          .split(";")
          .map((s: string, index) => (
            <li key={index}>- {s.trim()}</li>
          ))}
      </ul>
      <p className="mb-2">{t("serviceProvider.intro")}</p>
      <p>{t("serviceProvider.name")}</p>
      <p>{t("serviceProvider.address1")}</p>
      <p>{t("serviceProvider.address2")}</p>
      <p className="mb-4">{t("serviceProvider.address3")}</p>
      <h6 className="mb-2">{t("represented.title")}</h6>
      <p>Gregor Frankenstein-von der Beeck</p>
      <p>Guido Lohnherr</p>
      <p>Tel.: +49(0)211-75707-910</p>
      <p>Fax: +49(0)211-987300</p>
      <p>
        {t("represented.email")}{" "}
        <a
          className="text-primary hover:underline"
          href="mailto:info@matrix-ggmbh.de"
          target="_blank"
          rel="noreferrer"
        >
          info@matrix-ggmbh.de
        </a>
      </p>
      <p>{t("represented.vat")} DE 329043660</p>
      <p>{t("represented.register")} HRB 33341</p>
      <p className="mb-2">{t("represented.appointed")}</p>
      <p>{t("represented.responsible")}</p>
    </section>
  );
}
