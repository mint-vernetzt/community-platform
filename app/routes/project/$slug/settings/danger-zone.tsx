import { TabBar } from "@mint-vernetzt/components/src/organisms/TabBar";
import { Section } from "@mint-vernetzt/components/src/organisms/containers/Section";
import { type LoaderFunctionArgs } from "react-router";
import { Link, Outlet, useLoaderData, useLocation } from "react-router";
import { SettingsMenuBackButton } from "~/components-next/SettingsMenuBackButton";
import { detectLanguage } from "~/i18n.server";
import { Deep } from "~/lib/utils/searchParams";
import { languageModuleMap } from "~/locales/.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["project/$slug/settings/danger-zone"];

  return {
    locales,
  };
};

function DangerZone() {
  const location = useLocation();
  const { locales } = useLoaderData<typeof loader>();

  return (
    <Section>
      <SettingsMenuBackButton to={location.pathname} prefetch="intent">
        {locales.content.back}
      </SettingsMenuBackButton>
      <div id="danger-zone-tab-bar" className="mv-mt-2 @md:-mv-mt-2 mv-mb-4">
        <TabBar>
          <TabBar.Item active={location.pathname.endsWith("/change-url")}>
            <Link
              to={`./change-url?${Deep}=true`}
              preventScrollReset
              prefetch="intent"
            >
              {locales.content.changeUrl}
            </Link>
          </TabBar.Item>
          <TabBar.Item active={location.pathname.endsWith("/delete")}>
            <Link
              to={`./delete?${Deep}=true`}
              preventScrollReset
              prefetch="intent"
            >
              {locales.content.projectDelete}
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
