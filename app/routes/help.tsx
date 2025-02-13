import { RichText } from "~/components/Richtext/RichText";
import { Accordion } from "~/components-next/Accordion";
import { Link as StyledLink } from "@mint-vernetzt/components/src/molecules/Link";
import { useLoaderData } from "react-router";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { type LoaderFunctionArgs } from "react-router";
import { detectLanguage } from "~/i18n.server";
import { languageModuleMap } from "~/locales/.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["help"];
  return {
    supportMail: process.env.SUPPORT_MAIL,
    locales,
  };
};

export default function Help() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales } = loaderData;

  return (
    <>
      <section className="mv-w-full mv-mx-auto @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @2xl:mv-max-w-screen-container-2xl mv-px-4 @md:mv-px-6 @xl:mv-px-8 mv-pt-16 mv-pb-8 @md:mv-pb-12 @xl:mv-pb-16">
        <h1 className="mv-w-full mv-text-center mv-text-5xl @sm:mv-text-6xl @md:mv-text-7xl @xl:mv-text-8xl mv-font-[900] mv-leading-9 @sm:mv-leading-10 @md:mv-leading-[64px] @xl:mv-leading-[80px]">
          {locales.headline}
        </h1>
        <div className="mv-w-full mv-text-center mv-text-neutral-700 mv-leading-5">
          <p className="mv-mb-1">{locales.subline}</p>
          <p>
            <span>{locales.subline2}</span>{" "}
            <StyledLink
              as="a"
              to={`mailto:${loaderData.supportMail}`}
              variant="primary"
            >
              {loaderData.supportMail}
            </StyledLink>
          </p>
        </div>
      </section>
      <section className="mv-w-full mv-mx-auto @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @2xl:mv-max-w-screen-container-2xl mv-px-4 @md:mv-px-6 @xl:mv-px-8 mv-py-6 mv-mb-6 @md:mv-mb-8 @xl:mv-mb-12">
        <Accordion>
          {Object.entries(locales.faq).map(([topicKey]) => {
            const typedTopicKey = topicKey as keyof typeof locales.faq;
            const typedTopicValue = locales.faq[typedTopicKey];
            return (
              <Accordion.Topic id={typedTopicKey} key={typedTopicKey}>
                {typedTopicValue.headline}
                {Object.entries(typedTopicValue.qAndAs).map(([qAndAkey]) => {
                  if (qAndAkey in typedTopicValue.qAndAs) {
                    return (
                      <Accordion.Item
                        id={`${typedTopicKey}-${qAndAkey}`}
                        key={`${typedTopicKey}-${qAndAkey}`}
                      >
                        {/* TODO: fix type issues -> caused by nested loops */}
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
      <section className="mv-relative mv-flex mv-flex-col mv-items-center mv-w-full mv-py-16 mv-px-4 @md:mv-px-6 @xl:mv-px-8 mv-bg-accent-200">
        <div className="mv-absolute mv-top-0 mv-right-0 mv-hidden @md:mv-block">
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
        <div className="mv-absolute mv-top-0 mv-right-0 @md:mv-hidden">
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
        <div className="mv-w-full mv-text-center mv-mb-8 @md:mv-mb-10 @xl:mv-mb-12 mv-text-primary-600 @xl:mv-text-primary-500 mv-font-semibold">
          <h2 className="mv-mb-6 @xl:mv-mb-8 mv-text-4xl @xl:mv-text-5xl mv-leading-7 @md:mv-leading-8 @xl:mv-leading-9 mv-uppercase">
            {locales.support.headline}
          </h2>
          <div className="mv-flex mv-flex-col mv-items-center mv-text-lg @md:mv-text-xl @xl:mv-text-3xl mv-leading-6 @md:mv-leading-7 @xl:mv-leading-8">
            <p>{locales.support.subline}</p>
            <p>{locales.support.ctaText}</p>
            <p className="mv-w-fit mv-bg-secondary-200 mv-px-1">
              {loaderData.supportMail}
            </p>
          </div>
        </div>
        <div className="mv-w-fit">
          <Button
            as="a"
            href={`mailto:${loaderData.supportMail}`}
            variant="outline"
          >
            {locales.support.cta}
          </Button>
        </div>
      </section>
    </>
  );
}
