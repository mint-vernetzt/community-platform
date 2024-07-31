import { useTranslation } from "react-i18next";
import { faq } from "public/locales/en/help.json";
import { RichText } from "~/components/Richtext/RichText";
import { Accordion } from "./__help.components";
import { Button } from "@mint-vernetzt/components";

const i18nNS = ["help"];
export const handle = {
  i18n: i18nNS,
};

export default function Help() {
  const { t } = useTranslation(i18nNS);

  return (
    <>
      <section className="mv-w-full mv-mx-auto @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @2xl:mv-max-w-screen-container-2xl mv-px-4 @md:mv-px-6 @xl:mv-px-8 mv-pt-16 mv-pb-8 @md:mv-pb-12 @xl:mv-pb-16">
        <h1 className="mv-w-full mv-text-center mv-text-5xl @sm:mv-text-6xl @md:mv-text-7xl @xl:mv-text-8xl mv-font-[900] mv-leading-9 @sm:mv-leading-10 @md:mv-leading-[64px] @xl:mv-leading-[80px]">
          {t("headline")}
        </h1>
        <p className="mv-w-full mv-text-center mv-text-neutral-700 mv-leading-5">
          {t("subline")}
        </p>
      </section>
      <section className="mv-w-full mv-mx-auto @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @2xl:mv-max-w-screen-container-2xl mv-px-4 @md:mv-px-6 @xl:mv-px-8 mv-py-6 mv-mb-6 @md:mv-mb-8 @xl:mv-mb-12">
        <Accordion>
          {Object.entries(faq).map(([topicKey, topicValue]) => {
            return (
              <Accordion.Topic id={topicKey} key={topicKey}>
                {t(`faq.${topicKey}.headline`)}
                {Object.entries(topicValue).map(([qAndAkey]) => {
                  if (qAndAkey === "headline") {
                    return null;
                  }
                  return (
                    <Accordion.Item
                      id={`${topicKey}-${qAndAkey}`}
                      key={`${topicKey}-${qAndAkey}`}
                    >
                      {t(`faq.${topicKey}.${qAndAkey}.question`)}
                      <RichText
                        id="faq-content"
                        html={t(`faq.${topicKey}.${qAndAkey}.answer`)}
                      />
                    </Accordion.Item>
                  );
                })}
              </Accordion.Topic>
            );
          })}
        </Accordion>
      </section>
      <section className="mv-relative mv-flex mv-flex-col mv-items-center mv-w-full mv-py-16 mv-px-4 @md:mv-px-6 @xl:mv-px-8 mv-bg-accent-200 @md:mv-bg-primary-50">
        <div className="mv-absolute mv-top-0 mv-right-0 @md:mv-hidden">
          <svg
            width="160"
            height="95"
            viewBox="0 0 160 95"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6.09958 -64.2173C7.54864 -102.081 17.6128 -113.709 30.5663 -131.074C43.5198 -148.438 67.766 -154.578 80.5481 -156.374C98.0195 -158.828 140.796 -152.403 156.899 -150.791C185.751 -147.902 258.393 -127.105 264.522 -50.2964C273.557 62.9148 173.385 95.6622 144.191 90.0838C109.053 83.3698 111.189 65.6072 90.3268 51.8716C68.2058 37.3072 42.247 39.1163 27.195 24.9196C6.98256 5.85556 4.65052 -26.3535 6.09958 -64.2173Z"
              stroke="#FCC433"
            />
          </svg>
        </div>
        <div className="mv-w-full mv-text-center mv-mb-8 @md:mv-mb-10 @xl:mv-mb-12 mv-text-primary-600 @xl:mv-text-primary-500 mv-font-semibold">
          <h2 className="mv-mb-6 @xl:mv-mb-8 mv-text-4xl @xl:mv-text-5xl mv-leading-7 @md:mv-leading-8 @xl:mv-leading-9">
            {t("support.headline")}
          </h2>
          <div className="mv-flex mv-flex-col mv-items-center mv-text-lg @md:mv-text-xl @xl:mv-text-3xl mv-leading-6 @md:mv-leading-7 @xl:mv-leading-8">
            <p>{t("support.subline")}</p>
            <p>{t("support.ctaText")}</p>
            <p className="mv-w-fit mv-bg-secondary-200 mv-px-1">
              {t("support.email")}
            </p>
          </div>
        </div>
        <div className="mv-w-fit">
          <Button
            as="a"
            href="mailto:support@mint-vernetzt.de"
            variant="outline"
            size="small"
          >
            {t("support.cta")}
          </Button>
        </div>
      </section>
    </>
  );
}
