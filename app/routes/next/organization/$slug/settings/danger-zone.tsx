import { Section, TabBar } from "@mint-vernetzt/components";
import { Link, Outlet, useLocation } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { BackButton } from "~/routes/project/$slug/settings/__components";
import { Deep } from "~/lib/utils/searchParams";

const i18nNS = ["routes-next-organization-settings-danger-zone"] as const;
export const handle = {
  i18n: i18nNS,
};

function DangerZone() {
  const location = useLocation();
  const { t } = useTranslation(i18nNS);

  return (
    <Section>
      <BackButton to={location.pathname}>{t("content.back")}</BackButton>
      <div id="danger-zone-tab-bar" className="mv-mt-2 @md:-mv-mt-2 mv-mb-4">
        <TabBar>
          <TabBar.Item active={location.pathname.endsWith("/change-url")}>
            <Link to={`./change-url?${Deep}=true`} preventScrollReset>
              {t("content.changeUrl")}
            </Link>
          </TabBar.Item>
          <TabBar.Item active={location.pathname.endsWith("/delete")}>
            <Link to={`./delete?${Deep}=true`} preventScrollReset>
              {t("content.organizationDelete")}
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
