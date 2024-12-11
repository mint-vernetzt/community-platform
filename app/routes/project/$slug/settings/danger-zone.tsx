import { redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, Outlet, useLocation } from "@remix-run/react";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { BackButton } from "./__components";
import { getRedirectPathOnProtectedProjectRoute } from "./utils.server";
import { Section, TabBar } from "@mint-vernetzt/components";
import i18next from "~/i18next.server";
import { useTranslation } from "react-i18next";
import { detectLanguage } from "~/root.server";
import { Deep } from "~/lib/utils/searchParams";

const i18nNS = ["routes-project-settings-danger-zone"] as const;
export const handle = {
  i18n: i18nNS,
};

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;

  const locale = await detectLanguage(request);
  const t = await i18next.getFixedT(locale, i18nNS);
  const { authClient } = createAuthClient(request);

  const sessionUser = await getSessionUser(authClient);

  // check slug exists (throw bad request if not)
  invariantResponse(params.slug !== undefined, t("error.invalidRoute"), {
    status: 400,
  });

  const redirectPath = await getRedirectPathOnProtectedProjectRoute({
    request,
    slug: params.slug,
    sessionUser,
    authClient,
  });

  if (redirectPath !== null) {
    return redirect(redirectPath);
  }

  return null;
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
              {t("content.projectDelete")}
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
