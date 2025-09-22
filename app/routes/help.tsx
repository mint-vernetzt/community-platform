import { RichText } from "~/components/Richtext/RichText";
import { Accordion } from "~/components-next/Accordion";
import { Link as StyledLink } from "@mint-vernetzt/components/src/molecules/Link";
import { useLoaderData } from "react-router";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { type LoaderFunctionArgs } from "react-router";
import { detectLanguage } from "~/i18n.server";
import { languageModuleMap } from "~/locales/.server";
import { getFeatureAbilities } from "./feature-access.server";
import { createAuthClient } from "~/auth.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["help"];
  const { authClient } = createAuthClient(request);
  const abilities = await getFeatureAbilities(authClient, [
    "abuse_report",
    "provisional_organizations",
    "map_embed",
    "events",
  ]);
  return {
    abilities,
    supportMail: process.env.SUPPORT_MAIL,
    locales,
  };
};

export default function Help() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales, abilities } = loaderData;

  return (
    <>
      <section className="w-full mx-auto @md:max-w-screen-container-md @lg:max-w-screen-container-lg @xl:max-w-screen-container-xl @2xl:max-w-screen-container-2xl px-4 @md:px-6 @xl:px-8 pt-16 pb-8 @md:pb-12 @xl:pb-16">
        <h1 className="w-full text-center text-5xl @sm:text-6xl @md:text-7xl @xl:text-8xl font-[900] leading-9 @sm:leading-10 @md:leading-[64px] @xl:leading-[80px]">
          {locales.headline}
        </h1>
        <div className="w-full text-center text-neutral-700 leading-5">
          <p className="mb-1">{locales.subline}</p>
          <p>
            <span>{locales.subline2}</span>{" "}
            <StyledLink
              as="link"
              to={`mailto:${loaderData.supportMail}`}
              variant="primary"
            >
              {loaderData.supportMail}
            </StyledLink>
          </p>
        </div>
      </section>
      <section className="w-full mx-auto @md:max-w-screen-container-md @lg:max-w-screen-container-lg @xl:max-w-screen-container-xl @2xl:max-w-screen-container-2xl px-4 @md:px-6 @xl:px-8 py-6 mb-6 @md:mb-8 @xl:mb-12">
        <Accordion>
          {Object.entries(locales.faq).map(([topicKey]) => {
            const typedTopicKey = topicKey as keyof typeof locales.faq;
            const typedTopicValue = locales.faq[typedTopicKey];
            return (
              <Accordion.Topic id={typedTopicKey} key={typedTopicKey}>
                {typedTopicValue.headline}
                {Object.entries(typedTopicValue.qAndAs).map(([qAndAkey]) => {
                  if (qAndAkey in typedTopicValue.qAndAs) {
                    if (
                      // TODO: fix type issues -> caused by nested loops
                      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                      // @ts-ignore
                      "featureFlag" in typedTopicValue.qAndAs[qAndAkey] &&
                      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                      // @ts-ignore
                      abilities[typedTopicValue.qAndAs[qAndAkey].featureFlag]
                        .hasAccess === false
                    ) {
                      return null;
                    }
                    return (
                      <Accordion.Item
                        id={`${typedTopicKey}-${qAndAkey}`}
                        key={`${typedTopicKey}-${qAndAkey}`}
                      >
                        {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                        {/* @ts-ignore */}
                        {typedTopicValue.qAndAs[qAndAkey].question}
                        <RichText
                          id="faq-content"
                          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                          // @ts-ignore
                          html={typedTopicValue.qAndAs[qAndAkey].answer}
                        />
                      </Accordion.Item>
                    );
                  }
                  return null;
                })}
              </Accordion.Topic>
            );
          })}
        </Accordion>
      </section>
      <section className="relative flex flex-col items-center w-full py-16 px-4 @md:px-6 @xl:px-8 bg-accent-200">
        <div className="absolute top-0 right-0 hidden @md:block">
          <svg
            width="343"
            height="171"
            viewBox="0 0 343 171"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1 -124.89C1 -199.749 20.0024 -223.465 44.2789 -258.724C68.5555 -293.983 115.989 -307.936 141.104 -312.446C175.433 -318.611 260.424 -309.159 292.356 -307.193C349.57 -303.67 494.645 -268.101 512.56 -116.932C538.967 105.883 343.557 178.1 285.462 169.293C215.54 158.693 218.416 123.465 176.165 97.9251C131.365 70.8439 80.2207 76.3765 49.4126 49.4871C8.04198 13.3787 1 -50.0311 1 -124.89Z"
              stroke="#FCC433"
            />
          </svg>
        </div>
        <div className="absolute top-0 right-0 @md:hidden">
          <svg
            width="155"
            height="92"
            viewBox="0 0 155 92"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1.09958 -64.2173C2.54864 -102.081 12.6128 -113.709 25.5663 -131.074C38.5198 -148.438 62.766 -154.578 75.5481 -156.374C93.0195 -158.828 135.796 -152.403 151.899 -150.791C180.751 -147.902 253.393 -127.105 259.522 -50.2964C268.557 62.9148 168.385 95.6622 139.191 90.0838C104.053 83.3698 106.189 65.6072 85.3268 51.8716C63.2058 37.3072 37.247 39.1163 22.195 24.9196C1.98256 5.85556 -0.349481 -26.3535 1.09958 -64.2173Z"
              stroke="#FCC433"
            />
          </svg>
        </div>
        <div className="w-full text-center mb-8 @md:mb-10 @xl:mb-12 text-primary-600 @xl:text-primary-500 font-semibold">
          <h2 className="mb-6 @xl:mb-8 text-4xl @xl:text-5xl leading-7 @md:leading-8 @xl:leading-9 uppercase">
            {locales.support.headline}
          </h2>
          <div className="flex flex-col items-center text-lg @md:text-xl @xl:text-3xl leading-6 @md:leading-7 @xl:leading-8">
            <p>{locales.support.subline}</p>
            <p>{locales.support.ctaText}</p>
            <p className="w-fit bg-secondary-200 px-1">
              {loaderData.supportMail}
            </p>
          </div>
        </div>
        <div className="w-fit">
          <Button
            as="link"
            to={`mailto:${loaderData.supportMail}`}
            variant="outline"
          >
            {locales.support.cta}
          </Button>
        </div>
      </section>
    </>
  );
}
