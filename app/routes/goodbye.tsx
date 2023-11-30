import { useTranslation } from "react-i18next";

const i18nNS = ["routes/goodbye"];
export const handle = {
  i18n: i18nNS,
};

export default function GoodBye() {
  const { t } = useTranslation(i18nNS);

  return (
    <section className="container mt-8 md:mt-10 lg:mt-20 text-center">
      <h1>{t("content.headline")}</h1>
      <p className="mt-4">{t("content.info")}</p>
    </section>
  );
}
