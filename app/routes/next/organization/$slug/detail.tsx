import { TabBar } from "@mint-vernetzt/components";
import { type Organization } from "@prisma/client";
import {
  type LoaderFunctionArgs,
  type MetaFunction,
  json,
} from "@remix-run/node";
import { Link, Outlet, useLoaderData, useLocation } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { removeHtmlTags } from "~/lib/utils/sanitizeUserHtml";
import { filterOrganizationByVisibility } from "~/next-public-fields-filtering.server";
import { Container } from "~/routes/my/__events.components";
import { deriveOrganizationMode } from "~/routes/organization/$slug/utils.server";
import { addImgUrls, getOrganization } from "./detail.server";

const i18nNS = ["routes/next/organization/detail"];

export const meta: MetaFunction<typeof loader> = (args) => {
  const { data } = args;

  if (data === undefined) {
    return [
      { title: "MINTvernetzt Community Plattform" },
      {
        name: "description",
        property: "og:description",
        content:
          "Entdecke auf der MINTvernetzt Community-Plattform andere MINT-Akteur:innen, Organisationen und MINT-Veranstaltungen und lass Dich für Deine Arbeit inspirieren.",
      },
    ];
  }
  if (data.organization.bio === null && data.organization.background === null) {
    return [
      {
        title: `MINTvernetzt Community Plattform | ${data.organization.name}`,
      },
      {
        name: "description",
        property: "og:description",
        content:
          "Entdecke auf der MINTvernetzt Community-Plattform andere MINT-Akteur:innen, Organisationen und MINT-Veranstaltungen und lass Dich für Deine Arbeit inspirieren.",
      },
      {
        name: "image",
        property: "og:image",
        content: data.meta.baseUrl + "/images/default-event-background.jpg",
      },
      {
        property: "og:image:secure_url",
        content: data.meta.baseUrl + "/images/default-event-background.jpg",
      },
      {
        property: "og:url",
        content: data.meta.url,
      },
    ];
  }
  if (data.organization.bio === null) {
    return [
      {
        title: `MINTvernetzt Community Plattform | ${data.organization.name}`,
      },
      {
        name: "description",
        property: "og:description",
        content:
          "Entdecke auf der MINTvernetzt Community-Plattform andere MINT-Akteur:innen, Organisationen und MINT-Veranstaltungen und lass Dich für Deine Arbeit inspirieren.",
      },
      {
        name: "image",
        property: "og:image",
        content: data.organization.background,
      },
      {
        property: "og:image:secure_url",
        content: data.organization.background,
      },
      {
        property: "og:url",
        content: data.meta.url,
      },
    ];
  }
  if (data.organization.background === null) {
    return [
      {
        title: `MINTvernetzt Community Plattform | ${data.organization.name}`,
      },
      {
        name: "description",
        property: "og:description",
        content: removeHtmlTags(data.organization.bio),
      },
      {
        name: "image",
        property: "og:image",
        content: data.meta.baseUrl + "/images/default-event-background.jpg",
      },
      {
        property: "og:image:secure_url",
        content: data.meta.baseUrl + "/images/default-event-background.jpg",
      },
      {
        property: "og:url",
        content: data.meta.url,
      },
    ];
  }
  return [
    {
      title: `MINTvernetzt Community Plattform | ${data.organization.name}`,
    },
    {
      name: "description",
      property: "og:description",
      content: removeHtmlTags(data.organization.bio),
    },
    {
      name: "image",
      property: "og:image",
      content: data.organization.background,
    },
    {
      property: "og:image:secure_url",
      content: data.organization.background,
    },
    {
      property: "og:url",
      content: data.meta.url,
    },
  ];
};

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;

  const { authClient } = createAuthClient(request);
  await checkFeatureAbilitiesOrThrow(authClient, "next-organization-detail");
  const slug = getParamValueOrThrow(params, "slug");
  const sessionUser = await getSessionUser(authClient);
  const mode = await deriveOrganizationMode(sessionUser, slug);

  const organization = await getOrganization(slug);
  invariantResponse(organization !== null, "Organization not found", {
    status: 404,
  });

  let filteredOrganization;
  if (mode === "anon") {
    filteredOrganization = filterOrganizationByVisibility(organization);
  } else {
    filteredOrganization = organization;
  }

  const enhancedOrganization = addImgUrls(authClient, filteredOrganization);

  return json({
    organization: enhancedOrganization,
    meta: {
      baseUrl: process.env.COMMUNITY_BASE_URL,
      url: request.url,
    },
  });
};

function hasAboutData(
  organization: Pick<
    Organization,
    | "bio"
    | "email"
    | "phone"
    | "website"
    | "city"
    | "street"
    | "streetNumber"
    | "zipCode"
    | "facebook"
    | "linkedin"
    | "twitter"
    | "xing"
    | "instagram"
    | "youtube"
    | "mastodon"
    | "tiktok"
    | "supportedBy"
  > & {
    _count: {
      areas: number;
      focuses: number;
    };
  }
) {
  return (
    organization.bio !== null ||
    organization.email !== null ||
    organization.phone !== null ||
    organization.website !== null ||
    organization.city !== null ||
    organization.street !== null ||
    organization.streetNumber !== null ||
    organization.zipCode !== null ||
    organization.facebook !== null ||
    organization.linkedin !== null ||
    organization.twitter !== null ||
    organization.xing !== null ||
    organization.instagram !== null ||
    organization.youtube !== null ||
    organization.mastodon !== null ||
    organization.tiktok !== null ||
    organization._count.areas > 0 ||
    organization._count.focuses > 0 ||
    organization.supportedBy.length > 0
  );
}

function hasNetworkData(organization: {
  _count: {
    networkMembers: number;
    memberOf: number;
  };
}) {
  return (
    organization._count.networkMembers > 0 || organization._count.memberOf > 0
  );
}

function hasTeamData(organization: {
  _count: {
    teamMembers: number;
  };
}) {
  return organization._count.teamMembers > 0;
}

function hasEventsData(organization: {
  _count: {
    responsibleForEvents: number;
  };
}) {
  return organization._count.responsibleForEvents > 0;
}

function hasProjectsData(organization: {
  _count: {
    responsibleForProject: number;
  };
}) {
  return organization._count.responsibleForProject > 0;
}

function ProjectDetail() {
  const { t } = useTranslation(i18nNS);
  const loaderData = useLoaderData<typeof loader>();
  const { organization } = loaderData;
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <Container className="mv-bg-white @sm:mv-bg-none">
      {hasAboutData(organization) ||
      hasNetworkData(organization) ||
      hasTeamData(organization) ||
      hasEventsData(organization) ||
      hasProjectsData(organization) ? (
        // TODO: Section should have no border on mobile. Have we already got a <Section> component for this case?
        <Container.Section>
          <TabBar>
            {hasAboutData(organization) ? (
              <TabBar.Item active={pathname.endsWith("/about")}>
                <Link to="./about" preventScrollReset>
                  {t("tabbar.about")}
                </Link>
              </TabBar.Item>
            ) : null}
            {hasNetworkData(organization) ? (
              <TabBar.Item active={pathname.endsWith("/network")}>
                <Link to="./network" preventScrollReset>
                  {t("tabbar.network")}
                </Link>
              </TabBar.Item>
            ) : null}
            {hasTeamData(organization) ? (
              <TabBar.Item active={pathname.endsWith("/team")}>
                <Link to="./team" preventScrollReset>
                  {t("tabbar.team")}
                </Link>
              </TabBar.Item>
            ) : null}
            {hasEventsData(organization) ? (
              <TabBar.Item active={pathname.endsWith("/events")}>
                <Link to="./events" preventScrollReset>
                  {t("tabbar.events")}
                </Link>
              </TabBar.Item>
            ) : null}
            {hasProjectsData(organization) ? (
              <TabBar.Item active={pathname.endsWith("/projects")}>
                <Link to="./projects" preventScrollReset>
                  {t("tabbar.projects")}
                </Link>
              </TabBar.Item>
            ) : null}
          </TabBar>
          <Outlet />
        </Container.Section>
      ) : null}
    </Container>
  );
}

export default ProjectDetail;
