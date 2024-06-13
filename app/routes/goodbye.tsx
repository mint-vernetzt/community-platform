import { useTranslation } from "react-i18next";

const i18nNS = ["routes/goodbye"];
export const handle = {
  i18n: i18nNS,
};

export default function GoodBye() {
  const { t } = useTranslation(i18nNS);

  return (
    <section className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-[600px] @md:mv-max-w-[768px] @lg:mv-max-w-[1024px] @xl:mv-max-w-[1280px] @xl:mv-px-6 @2xl:mv-max-w-[1536px] mt-8 @md:mv-mt-10 @lg:mv-mt-20 text-center">
      <h1>{t("content.headline")}</h1>
      <p className="mt-4">{t("content.info")}</p>
    </section>
  );
}
