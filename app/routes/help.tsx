import { useTranslation } from "react-i18next";
import { faq } from "public/locales/en/help.json";

const i18nNS = ["help"];
export const handle = {
  i18n: i18nNS,
};

export default function Help() {
  const { t } = useTranslation(i18nNS);

  return (
    <>
      <section>
        <h1>{t("headline")}</h1>
        <p>{t("subline")}</p>
      </section>
      <section>
        <ul>
          {Object.entries(faq).map(([topicKey, topicValue]) => {
            return (
              <li key={topicKey}>
                <h2 className="mv-mb-2">{t(`faq.${topicKey}.headline`)}</h2>
                <ul>
                  {Object.entries(topicValue).map(([qAndAkey]) => {
                    console.log(qAndAkey);
                    if (qAndAkey === "headline") {
                      return null;
                    }
                    return (
                      <li key={`${topicKey}-${qAndAkey}`} className="mv-mb-4">
                        <label>
                          {t(`faq.${topicKey}.${qAndAkey}.question`)}
                        </label>
                        <p>{t(`faq.${topicKey}.${qAndAkey}.answer`)}</p>
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
