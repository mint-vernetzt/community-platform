import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { createAuthClient } from "~/auth.server";
import { detectLanguage } from "~/i18n.server";
import { languageModuleMap } from "~/locales/.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";

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
      <section>
        <div>
          <h1>{locales.content.headline}</h1>
          <p>{locales.content.info}</p>
        </div>
      </section>
    </>
  );
}
