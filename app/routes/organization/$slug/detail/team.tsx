import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { createAuthClient, getSessionUser } from "~/auth.server";
import i18next from "~/i18next.server";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { detectLanguage } from "~/root.server";
import { deriveOrganizationMode } from "~/routes/organization/$slug/utils.server";
import { addImgUrls, filterOrganization, getOrganization } from "./team.server";
import { invariantResponse } from "~/lib/utils/response";
import { useTranslation } from "react-i18next";
import { useLoaderData } from "@remix-run/react";
import { Container } from "~/routes/my/__events.components";
import { i18nNS } from "./__team.shared";
import { ListContainer, ListItem } from "~/routes/my/__components";

export const handle = {
  i18n: i18nNS,
};

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;

  const { authClient } = createAuthClient(request);
  const slug = getParamValueOrThrow(params, "slug");
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

  const enhancedOrganization = addImgUrls(authClient, filteredOrganization);

  return json({
    organization: enhancedOrganization,
  });
};

function Team() {
  const { t } = useTranslation(i18nNS);
  const loaderData = useLoaderData<typeof loader>();
  const { organization } = loaderData;

  return (
    <Container.Section className="-mv-mt-4 @md:-mv-mt-6 @lg:-mv-mt-8 mv-pt-10 @sm:mv-py-8 @sm:mv-px-4 @lg:mv-px-6 mv-flex mv-flex-col mv-gap-10 @sm:mv-border-b @sm:mv-border-x @sm:mv-border-neutral-200 mv-bg-white @sm:mv-rounded-b-2xl">
      {organization.teamMembers.length > 0 ? (
        <div className="mv-flex mv-flex-col mv-gap-4">
          <h2 className="mv-mb-0 mv-text-neutral-700 mv-text-xl mv-font-bold mv-leading-6">
            {t("headlines.teamMembers")}
          </h2>
          <ListContainer listKey="team-members">
            {organization.teamMembers.map((relation, index) => {
              return (
                <ListItem
                  key={`team-member-${relation.profile.username}`}
                  listIndex={index}
                  entity={relation.profile}
                />
              );
            })}
          </ListContainer>
        </div>
      ) : null}
    </Container.Section>
  );
}

export default Team;
