import { type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { filterOrganization, getOrganization } from "./index.server";
import { invariantResponse } from "~/lib/utils/response";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { deriveOrganizationMode } from "~/routes/organization/$slug/utils.server";
import { detectLanguage } from "~/root.server";
import i18next from "~/i18next.server";
import { i18nNS } from "./__index.shared";
import {
  hasAboutData,
  hasEventsData,
  hasNetworkData,
  hasProjectsData,
  hasTeamData,
} from "../__detail.shared";

export const handle = {
  i18n: i18nNS,
};

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const slug = getParamValueOrThrow(params, "slug");
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);
  const mode = await deriveOrganizationMode(sessionUser, slug);
  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, i18nNS);
  const organization = await getOrganization(slug);
  invariantResponse(
    organization !== null,
    t("server.error.organizationNotFound"),
    {
      status: 404,
    }
  );

  let filteredOrganization;
  if (mode === "anon") {
    filteredOrganization = filterOrganization(organization);
  } else {
    filteredOrganization = organization;
  }

  if (hasAboutData(filteredOrganization)) {
    return redirect(`/organization/${slug}/detail/about`);
  }
  const redirectPath = hasNetworkData(filteredOrganization)
    ? `/organization/${slug}/detail/network`
    : hasTeamData(filteredOrganization)
    ? `/organization/${slug}/detail/team`
    : hasEventsData(filteredOrganization)
    ? `/organization/${slug}/detail/events`
    : hasProjectsData(filteredOrganization)
    ? `/organization/${slug}/detail/projects`
    : `/organization/${slug}/detail`;
  return redirect(redirectPath);
};
