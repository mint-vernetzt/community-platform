import { TabBar } from "@mint-vernetzt/components/src/organisms/TabBar";
import { Section } from "@mint-vernetzt/components/src/organisms/containers/Section";
import { type LoaderFunctionArgs } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useLocation } from "@remix-run/react";
import { BackButton } from "~/components-next/BackButton";
import { detectLanguage } from "~/i18n.server";
import { Deep } from "~/lib/utils/searchParams";
import { languageModuleMap } from "~/locales/.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/organization/$slug/settings/danger-zone"];

  return {
    locales,
  };
};

function DangerZone() {
  const location = useLocation();
  const { locales } = useLoaderData<typeof loader>();

  return (
    <Section>
      <BackButton to={location.pathname}>{locales.content.back}</BackButton>
      <div id="danger-zone-tab-bar" className="mv-mt-2 @md:-mv-mt-2 mv-mb-4">
        <TabBar>
          <TabBar.Item active={location.pathname.endsWith("/change-url")}>
            <Link to={`./change-url?${Deep}=true`} preventScrollReset>
              {locales.content.changeUrl}
            </Link>
          </TabBar.Item>
          <TabBar.Item active={location.pathname.endsWith("/delete")}>
            <Link to={`./delete?${Deep}=true`} preventScrollReset>
              {locales.content.organizationDelete}
            </Link>
          </TabBar.Item>
        </TabBar>
      </div>
      <div className="mv-flex mv-flex-col mv-gap-6 @md:mv-gap-4">
        <Outlet />
      </div>
    </Section>
  );
}

export default DangerZone;
