import { useTranslation } from "react-i18next";

export default function GoodBye() {
  const { t } = useTranslation(["routes/goodbye"]);

  return (
    <section className="container mt-8 md:mt-10 lg:mt-20 text-center">
      <h1>Auf Wiedersehen</h1>
      <p className="mt-4">{t("content")}</p>
    </section>
  );
}
