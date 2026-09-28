import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { createAuthClient } from "~/auth.server";
import { detectLanguage } from "~/i18n.server";
import { languageModuleMap } from "~/locales/.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { Image } from "@mint-vernetzt/components/src/molecules/Image";
import introImage from "~/assets/get-involved/MINT-V-JT-11022025-LOW-258 2.jpg";
import introImageBlurred from "~/assets/get-involved/MINT-V-JT-11022025-LOW-258 2-blurred.webp";

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
      <section className="w-full flex flex-col md:flex-row md:items-center md:justify-between gap-12 md:gap-10 pt-12 md:pt-16 md:pb-16 max-w-2xl mx-auto">
        <div className="w-full flex flex-col gap-6 px-4 md:px-0 md:pl-10 xl:pl-16">
          <h1 className="mb-0 text-primary-600 text-5xl font-bold leading-9">
            {locales.intro.headline}
          </h1>
          <p className="text-neutral-800 text-lg font-semibold leading-6">
            {locales.intro.info}
          </p>
        </div>
        <div className="md:pr-10 xl:pr-16">
          <div className="w-full md:w-135 md:min-w-135 h-90 md:rounded-2xl md:overflow-hidden">
            <Image
              src={introImage}
              blurredSrc={introImageBlurred}
              alt={locales.intro.image.alt}
              gravity="top"
            >
              <Image.Credits credits={locales.intro.image.credit} />
            </Image>
          </div>
        </div>
      </section>
    </>
  );
}
