import { useTranslation } from "react-i18next";
import { faq } from "public/locales/en/help.json";
import { Icon } from "./__components";
import { RichText } from "~/components/Richtext/RichText";

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
      {/* Margin bottom in this section is only applied because the next secion is not yet implemented (Support CTA) */}
      <section className="mv-w-full mv-mx-auto @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @2xl:mv-max-w-screen-container-2xl mv-px-4 @md:mv-px-6 @xl:mv-px-8 mv-py-6 mv-mb-[72px]">
        <ul className="mv-flex mv-flex-col mv-gap-10 @xl:mv-gap-[52px] mv-px-0 mv-pt-0 mv-pb-0 @md:mv-px-8 @md:mv-pt-8 @md:mv-pb-12 @md:mv-border @md:mv-border-neutral-200 @md:mv-rounded-2xl @md:mv-bg-white">
          {Object.entries(faq).map(([topicKey, topicValue]) => {
            return (
              <li key={topicKey}>
                <h2 className="mv-mb-2 @md:mv-mb-3 @xl:mv-mb-5 mv-text-secondary mv-text-3xl mv-font-semibold mv-leading-7">
                  {t(`faq.${topicKey}.headline`)}
                </h2>
                <ul>
                  {Object.entries(topicValue).map(([qAndAkey]) => {
                    if (qAndAkey === "headline") {
                      return null;
                    }
                    return (
                      <li
                        key={`${topicKey}-${qAndAkey}`}
                        className="mv-group mv-border-neutral-200 mv-border-b"
                      >
                        <label
                          htmlFor={`expand-question-${topicKey}-${qAndAkey}`}
                          className="mv-flex-grow mv-pb-6 mv-pt-6 @xl:mv-pb-8 @xl:mv-pt-8 group-has-[:checked]:mv-pb-0 mv-text-primary-600 mv-text-xl mv-font-bold mv-leading-6 mv-cursor-pointer mv-flex mv-gap-2 mv-items-center mv-mb-0"
                        >
                          <p className="mv-flex-grow">
                            {t(`faq.${topicKey}.${qAndAkey}.question`)}
                          </p>
                          <span className="mv-flex-shrink mv-w-fit mv-h-fit mv-rotate-90 group-has-[:checked]:-mv-rotate-90 mv-mr-0 @md:mv-mr-3 @lg:mv-mr-6">
                            <Icon type="chevron-right" />
                          </span>
                        </label>
                        <input
                          id={`expand-question-${topicKey}-${qAndAkey}`}
                          type="checkbox"
                          className="mv-absolute mv-opacity-0 mv-w-0 mv-h-0 mv-overflow-hidden"
                        />
                        <div
                          id="faq-content"
                          className="mv-text-primary-600 mv-leading-[20.8px] mv-font-normal mv-pr-5 mv-pt-[10px] mv-pb-6 @xl:mv-pt-4 @xl:mv-pb-8 @sm:mv-pr-8 @md:mv-pr-20 @xl:mv-pr-[166px] mv-hidden group-has-[:checked]:mv-block mv-hyphens-auto"
                        >
                          {/* {qAndAkey === "whatIsStem" ? (
                            <Trans
                              i18nKey={`faq.${topicKey}.${qAndAkey}.answer`}
                              ns={i18nNS}
                              components={{
                                pTop: <p className="mv-mb-2" />,
                                pBottom: <p />,
                              }}
                            />
                          ) : qAndAkey === "whoIsThePlatformFor" ? (
                            <Trans
                              i18nKey={`faq.${topicKey}.${qAndAkey}.answer`}
                              ns={i18nNS}
                              components={{
                                p: <p className="mv-mb-2" />,
                                ul: (
                                  <ul className="mv-list-disc mv-flex mv-flex-col mv-gap-1" />
                                ),
                                li: <li className="mv-ml-4" />,
                              }}
                            />
                          ) : qAndAkey === "benefitsOfThePlatform" ? (
                            <Trans
                              i18nKey={`faq.${topicKey}.${qAndAkey}.answer`}
                              ns={i18nNS}
                              components={{
                                pTop: <p className="mv-mb-2" />,
                                pBottom: <p className="mv-my-2" />,
                                ul: (
                                  <ul className="mv-list-disc mv-flex mv-flex-col mv-gap-1" />
                                ),
                                li: <li className="mv-ml-4" />,
                              }}
                            />
                          ) : qAndAkey === "whoOperatesThePlatform" ? (
                            <Trans
                              i18nKey={`faq.${topicKey}.${qAndAkey}.answer`}
                              ns={i18nNS}
                              components={{
                                pTop: <p className="mv-mb-2" />,
                                pBottom: <p />,
                              }}
                            />
                          ) : qAndAkey === "mintId" ? (
                            <Trans
                              i18nKey={`faq.${topicKey}.${qAndAkey}.answer`}
                              ns={i18nNS}
                              components={{
                                p: <p className="mv-mb-2" />,
                                a: (
                                  <a // eslint-disable-line jsx-a11y/anchor-has-content
                                    href="https://mint-vernetzt.de/terms-of-use-community-platform"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mv-font-semibold mv-cursor-pointer mv-underline hover:mv-no-underline"
                                  />
                                ),
                              }}
                            />
                          ) : qAndAkey === "registrationProblems" ||
                            qAndAkey === "emailChanged" ? (
                            <Trans
                              i18nKey={`faq.${topicKey}.${qAndAkey}.answer`}
                              ns={i18nNS}
                              components={{
                                p: <p className="mv-mb-2" />,
                                a: (
                                  <a // eslint-disable-line jsx-a11y/anchor-has-content
                                    href="mailto:support@mint-vernetzt.de"
                                    className="mv-font-semibold mv-cursor-pointer mv-underline hover:mv-no-underline"
                                  />
                                ),
                              }}
                            />
                          ) : qAndAkey === "eventParticipation" ? (
                            <Trans
                              i18nKey={`faq.${topicKey}.${qAndAkey}.answer`}
                              ns={i18nNS}
                              components={{
                                p: <p className="mv-mb-2" />,
                                a: (
                                  <a // eslint-disable-line jsx-a11y/anchor-has-content
                                    href="/register"
                                    className="mv-font-semibold mv-cursor-pointer mv-underline hover:mv-no-underline"
                                  />
                                ),
                              }}
                            />
                          ) : qAndAkey === "eventCreation" ? (
                            <Trans
                              i18nKey={`faq.${topicKey}.${qAndAkey}.answer`}
                              ns={i18nNS}
                              components={{
                                pTop: <p className="mv-mb-2" />,
                                pBottom: <p />,
                                span: <span className="mv-font-semibold" />,
                              }}
                            />
                          ) : qAndAkey === "contribution" ? (
                            <Trans
                              i18nKey={`faq.${topicKey}.${qAndAkey}.answer`}
                              ns={i18nNS}
                              components={{
                                aCommunity: (
                                  <a // eslint-disable-line jsx-a11y/anchor-has-content
                                    href="mailto:community@mint-vernetzt.de"
                                    className="mv-font-semibold mv-cursor-pointer mv-underline hover:mv-no-underline"
                                  />
                                ),
                                aGithub: (
                                  <a // eslint-disable-line jsx-a11y/anchor-has-content
                                    href="https://github.com/mint-vernetzt/community-platform"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mv-font-semibold mv-cursor-pointer mv-underline hover:mv-no-underline"
                                  />
                                ),
                              }}
                            />
                          ) : qAndAkey === "questionsSuggestionsWishes" ? (
                            <Trans
                              i18nKey={`faq.${topicKey}.${qAndAkey}.answer`}
                              ns={i18nNS}
                              components={{
                                a: (
                                  <a // eslint-disable-line jsx-a11y/anchor-has-content
                                    href="mailto:community@mint-vernetzt.de"
                                    className="mv-font-semibold mv-cursor-pointer mv-underline hover:mv-no-underline"
                                  />
                                ),
                              }}
                            />
                          ) : ( */}
                          <RichText
                            html={t(`faq.${topicKey}.${qAndAkey}.answer`)}
                          />
                          {/* )} */}
                        </div>
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
