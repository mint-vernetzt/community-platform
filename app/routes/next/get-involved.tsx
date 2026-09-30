import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { createAuthClient } from "~/auth.server";
import { detectLanguage } from "~/i18n.server";
import { languageModuleMap } from "~/locales/.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { Image } from "@mint-vernetzt/components/src/molecules/Image";
import introImage from "~/assets/get-involved/MINT-V-JT-11022025-LOW-258 2.jpg";
import introImageBlurred from "~/assets/get-involved/MINT-V-JT-11022025-LOW-258 2-blurred.webp";
import { Roadmap } from "@mint-vernetzt/components/src/organisms/Roadmap";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;

  const { authClient } = createAuthClient(request);
  await checkFeatureAbilitiesOrThrow(authClient, ["next_landingpage"]);

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["next/get-involved"];

  return { locales };
};

export default function GetInvolved() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales } = loaderData;

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
    </>
  );
}
