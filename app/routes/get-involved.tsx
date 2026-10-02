import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { detectLanguage } from "~/i18n.server";
import { languageModuleMap } from "~/locales/.server";
import { Image } from "@mint-vernetzt/components/src/molecules/Image";
import introImage from "~/assets/get-involved/MINT-V-JT-11022025-LOW-258 2.webp";
import introImageBlurred from "~/assets/get-involved/MINT-V-JT-11022025-LOW-258 2-blurred.webp";
import { Roadmap } from "@mint-vernetzt/components/src/organisms/Roadmap";
import secondFundingPhaseImage from "~/assets/get-involved/MINT-V-JT-12022025-LOW-283 2.webp";
import secondFundingPhaseImageBlurred from "~/assets/get-involved/MINT-V-JT-12022025-LOW-283 2-blurred.webp";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import {
  GetInvolvedWobble,
  SurveyAndResearchCtaWobble,
} from "./get-involved.shared";
import { getDataForSurveyAndResearchCta } from "./get-involved.server";
import { External } from "~/components-next/icons/External";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["get-involved"];

  const dataForSurveyAndResearchCta = getDataForSurveyAndResearchCta();

  return { locales, dataForSurveyAndResearchCta };
};

export default function GetInvolved() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales, dataForSurveyAndResearchCta } = loaderData;

  return (
    <>
      {/* Intro Section */}
      <section className="w-full flex flex-col md:flex-row md:items-center md:justify-between gap-12 md:gap-10 pt-12 md:pt-16 md:pb-16 max-w-2xl mx-auto">
        <div className="w-full md:w-100 md:min-w-100 flex flex-col gap-6 px-4 md:px-0 md:pl-10 xl:pl-16">
          <h1 className="mb-0 text-primary-600 text-5xl font-bold leading-9">
            {locales.route.intro.headline}
          </h1>
          <p className="text-neutral-800 text-lg font-semibold leading-6">
            {locales.route.intro.info}
          </p>
        </div>
        <div className="w-full md:pr-10 xl:pr-16">
          <div className="w-full h-90 md:rounded-2xl md:overflow-hidden">
            <Image
              src={introImage}
              blurredSrc={introImageBlurred}
              alt={locales.route.intro.image.alt}
              gravity="top"
            >
              <Image.Credits credits={locales.route.intro.image.credit} />
            </Image>
          </div>
        </div>
      </section>
      {/* Roadmap Section */}
      <section className="w-full py-12 md:py-16 px-4 md:px-10 xl:px-16 max-w-2xl mx-auto">
        <Roadmap locales={locales} />
      </section>
      {/* Second funding phase section */}
      <section className="w-full flex flex-col md:flex-row md:items-center md:justify-between gap-12 md:gap-10 md:pt-16 pb-12 md:pb-10 max-w-2xl mx-auto">
        <div className="w-full md:pl-10 xl:pl-16">
          <div className="w-full h-90 md:rounded-2xl md:overflow-hidden">
            <Image
              src={secondFundingPhaseImage}
              blurredSrc={secondFundingPhaseImageBlurred}
              alt={locales.route.secondFundingPhase.image.alt}
              gravity="top"
            >
              <Image.Credits
                credits={locales.route.secondFundingPhase.image.credit}
              />
            </Image>
          </div>
        </div>
        <div className="w-full md:w-100 md:min-w-100 flex flex-col gap-6 px-4 md:px-0 md:pr-10 xl:pr-16">
          <h1 className="mb-0 text-primary-600 text-5xl font-bold leading-9">
            {locales.route.secondFundingPhase.headline}
          </h1>
          <p className="text-neutral-800 text-lg font-semibold leading-6">
            {locales.route.secondFundingPhase.info}
          </p>
        </div>
      </section>
      {/* Survey and research cta section */}
      {locales.route.surveyAndResearchCta !== false ? (
        <section className="w-full pb-12 px-4 md:px-10 md:pb-10 xl:px-16 xl:pb-16 max-w-2xl mx-auto">
          <div className="relative isolate w-full flex flex-col gap-10 p-6 md:p-10 bg-secondary-600 rounded-2xl overflow-hidden">
            <div className="max-w-148 flex flex-col gap-6">
              <h2 className="mb-0 text-white text-5xl font-bold leading-9">
                {locales.route.surveyAndResearchCta.headline}
              </h2>
              <p className="text-neutral-50 text-lg font-semibold leading-6">
                {locales.route.surveyAndResearchCta.info}
              </p>
            </div>
            <Button
              as="link"
              variant="outline"
              to={dataForSurveyAndResearchCta.to}
              prefetch={
                dataForSurveyAndResearchCta.external === false
                  ? "intent"
                  : undefined
              }
              target={
                dataForSurveyAndResearchCta.external ? "_blank" : undefined
              }
              rel={
                dataForSurveyAndResearchCta.external
                  ? "noopener noreferrer"
                  : undefined
              }
            >
              {locales.route.surveyAndResearchCta.cta}
            </Button>
            <SurveyAndResearchCtaWobble />
          </div>
        </section>
      ) : null}
      {/* Get involved section */}
      <section className="w-full pb-12 px-4 md:px-10 md:pb-16 md:pt-16 max-w-2xl mx-auto">
        <div className="relative isolate w-full flex flex-col gap-10 p-6 md:p-10 bg-white md:bg-neutral-100 rounded-2xl overflow-hidden border border-neutral-200">
          <div className="max-w-148 flex flex-col gap-6">
            <h2 className="mb-0 text-primary-600 text-5xl font-bold leading-10">
              {locales.route.getInvolved.headline}
            </h2>
            <p className="text-neutral-700 text-lg font-normal md:font-semibold leading-5 md:leading-6">
              {locales.route.getInvolved.info}
            </p>
          </div>
          <div className="flex gap-4">
            <Button
              as="link"
              variant="outline"
              to={`mailto:${ENV.SUPPORT_MAIL}?subject=${locales.route.getInvolved.email.subject}`}
            >
              {locales.route.getInvolved.email.cta}
            </Button>
            <Button
              as="link"
              variant="outline"
              to={`https://github.com/mint-vernetzt/community-platform`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <External />
              <span>{locales.route.getInvolved.github.cta}</span>
            </Button>
          </div>
          <GetInvolvedWobble />
        </div>
      </section>
    </>
  );
}
