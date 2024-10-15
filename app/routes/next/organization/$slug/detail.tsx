import {
  Avatar,
  Button,
  Image,
  TabBar,
  TextButton,
} from "@mint-vernetzt/components";
import { type Organization } from "@prisma/client";
import {
  type LoaderFunctionArgs,
  type MetaFunction,
  json,
} from "@remix-run/node";
import {
  Form,
  Link,
  Outlet,
  useLoaderData,
  useLocation,
} from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { removeHtmlTags } from "~/lib/utils/sanitizeUserHtml";
import { Container } from "~/routes/my/__events.components";
import { deriveOrganizationMode } from "~/routes/organization/$slug/utils.server";
import {
  addImgUrls,
  filterOrganization,
  getOrganization,
} from "./detail.server";
import { detectLanguage } from "~/root.server";
import i18next from "~/i18next.server";
import { Modal } from "~/routes/__components";
import ImageCropper from "~/components/ImageCropper/ImageCropper";
import rcSliderStyles from "rc-slider/assets/index.css";
import reactCropStyles from "react-image-crop/dist/ReactCrop.css";

const i18nNS = [
  "routes/next/organization/detail",
  "datasets/organizationTypes",
];

export const handle = {
  i18n: i18nNS,
};

export function links() {
  return [
    { rel: "stylesheet", href: rcSliderStyles },
    { rel: "stylesheet", href: reactCropStyles },
  ];
}

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
    mode,
    meta: {
      baseUrl: process.env.COMMUNITY_BASE_URL,
      url: request.url,
    },
  } as const);
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
  const { organization, mode } = loaderData;
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <Container
      outerContainerClassName="mv-w-full mv-h-full mv-flex mv-justify-center mv-bg-white @sm:mv-bg-transparent"
      innerContainerClassName="mv-w-full mv-py-4 mv-px-4 @lg:mv-py-8 @md:mv-px-6 @lg:mv-px-8 mv-flex mv-flex-col mv-gap-4 mv-mb-10 @sm:mv-mb-[72px] @lg:mv-mb-16 mv-max-w-screen-2xl"
    >
      {/* Back Button Section */}
      <Container.Section className="">
        <TextButton weight="thin" variant="neutral" arrowLeft>
          <Link to="/explore/organizations" prefetch="intent">
            {t("back")}
          </Link>
        </TextButton>
      </Container.Section>
      {/* Header Section */}
      <Container.Section className="mv-relative mv-flex mv-flex-col mv-items-center mv-border mv-border-neutral-200 mv-bg-white mv-rounded-2xl mv-overflow-hidden">
        <div className="mv-w-full mv-h-[196px] @sm:mv-h-[168px]">
          <Image
            alt={`${t("header.image.alt")} ${organization.name}`}
            src={organization.background || undefined}
            blurredSrc={organization.blurredBackground}
            resizeType="fill"
          />
        </div>
        <div className="mv-w-full mv-px-4 @sm:mv-px-6 @md:mv-px-8 mv-pt-9 @sm:mv-pt-8 mv-pb-6 @sm:mv-pb-7 @md:mv-pb-8 mv-flex mv-flex-col @sm:mv-flex-row mv-items-center @sm:mv-items-start mv-gap-10 @sm:mv-gap-3 @sm:mv-justify-between">
          <div className="mv-flex mv-flex-col mv-items-center @sm:mv-items-start mv-gap-6 @sm:mv-flex-grow @sm:mv-w-full">
            <div className="mv-flex mv-flex-col mv-items-center @sm:mv-items-start mv-gap-2">
              {mode === "admin" ? (
                <div className="@sm:mv-hidden">
                  <TextButton
                    variant="primary"
                    weight="thin"
                    as="button"
                    type="submit"
                    form="modal-logo-form"
                  >
                    <div>
                      <div className="mv-cursor-pointer mv-flex mv-flex-nowrap mv-gap-1 mv-items-center">
                        <svg
                          width="17"
                          height="16"
                          viewBox="0 0 17 16"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="currentColor"
                        >
                          <path d="M14.9 3.116a.423.423 0 0 0-.123-.299l-1.093-1.093a.422.422 0 0 0-.598 0l-.882.882 1.691 1.69.882-.882a.423.423 0 0 0 .123-.298Zm-3.293.087 1.69 1.69v.001l-5.759 5.76a.422.422 0 0 1-.166.101l-2.04.68a.211.211 0 0 1-.267-.267l.68-2.04a.423.423 0 0 1 .102-.166l5.76-5.76ZM2.47 14.029a1.266 1.266 0 0 1-.37-.895V3.851a1.266 1.266 0 0 1 1.265-1.266h5.486a.422.422 0 0 1 0 .844H3.366a.422.422 0 0 0-.422.422v9.283a.422.422 0 0 0 .422.422h9.284a.422.422 0 0 0 .421-.422V8.07a.422.422 0 0 1 .845 0v5.064a1.266 1.266 0 0 1-1.267 1.266H3.367c-.336 0-.658-.133-.895-.37Z" />
                        </svg>
                        <span>{t("header.controls.logo")}</span>
                      </div>
                    </div>
                  </TextButton>
                </div>
              ) : null}
              <h1 className="mv-mb-0 mv-text-3xl @sm:mv-text-4xl @md:mv-text-5xl mv-font-bold mv-leading-7 @sm:mv-leading-8 @md:mv-leading-9">
                {organization.name}
              </h1>
              {organization.types.length > 0 ? (
                <p className="mv-px-8 @sm:mv-px-0 mv-text-neutral-600 mv-text-lg mv-font-semibold mv-leading-6">
                  {organization.types
                    .map((relation) => {
                      return t(`${relation.organizationType.slug}.title`, {
                        ns: "datasets/organizationTypes",
                      });
                    })
                    .join(" / ")}
                </p>
              ) : null}
            </div>
            {organization.networkMembers.length > 0 ? (
              <div className="mv-flex mv-items-center mv-gap-2">
                <div className="mv-flex mv-pl-[16px] *:mv--ml-[16px]">
                  {organization.networkMembers.slice(0, 3).map((relation) => {
                    return (
                      <Avatar
                        key={`network-member-logo-${relation.networkMember.slug}`}
                        to={`/organization/${relation.networkMember.slug}`}
                        size="md"
                        name={relation.networkMember.name}
                        logo={relation.networkMember.logo}
                      />
                    );
                  })}
                </div>
                {organization.networkMembers.length > 3 && (
                  <div className="mv-font-semibold mv-text-primary mv-leading-[22px]">
                    +{organization.networkMembers.length - 3}
                  </div>
                )}
              </div>
            ) : null}
          </div>
          {mode === "admin" ? (
            <div className="mv-w-full @sm:mv-w-fit mv-grid @sm:mv-flex mv-grid-rows-1 mv-grid-cols-2 mv-gap-2">
              <Button
                as="a"
                href={`/organization/${organization.slug}/settings`}
              >
                {t("header.controls.edit")}
              </Button>
              <div className="@sm:mv-hidden mv-w-full">
                <Button
                  variant="outline"
                  type="submit"
                  form="modal-background-form"
                  fullSize
                >
                  <div className="mv-flex mv-flex-nowrap">
                    <svg
                      width="17"
                      height="16"
                      viewBox="0 0 17 16"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="currentColor"
                    >
                      <path d="M14.9 3.116a.423.423 0 0 0-.123-.299l-1.093-1.093a.422.422 0 0 0-.598 0l-.882.882 1.691 1.69.882-.882a.423.423 0 0 0 .123-.298Zm-3.293.087 1.69 1.69v.001l-5.759 5.76a.422.422 0 0 1-.166.101l-2.04.68a.211.211 0 0 1-.267-.267l.68-2.04a.423.423 0 0 1 .102-.166l5.76-5.76ZM2.47 14.029a1.266 1.266 0 0 1-.37-.895V3.851a1.266 1.266 0 0 1 1.265-1.266h5.486a.422.422 0 0 1 0 .844H3.366a.422.422 0 0 0-.422.422v9.283a.422.422 0 0 0 .422.422h9.284a.422.422 0 0 0 .421-.422V8.07a.422.422 0 0 1 .845 0v5.064a1.266 1.266 0 0 1-1.267 1.266H3.367c-.336 0-.658-.133-.895-.37Z" />
                    </svg>
                    <span className="ml-2 ">
                      {t("header.controls.background")}
                    </span>
                  </div>
                </Button>
              </div>
            </div>
          ) : null}
        </div>
        <div className="mv-absolute mv-top-14 @sm:mv-top-8 @sm:mv-left-8 mv-w-40 mv-h-40 mv-rounded-full mv-shadow-[0_4px_16px_0_rgba(0,0,0,0.12)]">
          <Avatar
            logo={organization.logo}
            name={organization.name}
            size="full"
            textSize="xl"
          />
        </div>
      </Container.Section>
      {mode === "admin" && (
        <>
          <Form
            id="modal-background-form"
            method="get"
            action={location.pathname}
            preventScrollReset
          >
            <input hidden name="modal-background" defaultValue="true" />
          </Form>
          <Modal searchParam="modal-background">
            <Modal.Title>{t("cropper.background.headline")}</Modal.Title>
            <Modal.Section>
              <ImageCropper
                subject="organization"
                id="modal-background-upload"
                uploadKey="background"
                image={organization.background || undefined}
                aspect={31 / 10}
                minCropWidth={620}
                minCropHeight={62}
                maxTargetWidth={1488}
                maxTargetHeight={480}
                slug={organization.slug}
                redirect={pathname}
                modalSearchParam="modal-background"
              >
                {organization.background !== undefined ? (
                  <Image
                    src={organization.background || undefined}
                    alt={`${t("header.image.alt")} ${organization.name}`}
                    blurredSrc={organization.blurredBackground}
                  />
                ) : (
                  <div className="mv-w-[336px] mv-min-h-[108px] mv-bg-attention-400" />
                )}
              </ImageCropper>
            </Modal.Section>
          </Modal>
          <Form
            id="modal-logo-form"
            method="get"
            action={location.pathname}
            preventScrollReset
          >
            <input hidden name="modal-logo" defaultValue="true" />
          </Form>
          <Modal searchParam="modal-logo">
            <Modal.Title>{t("cropper.logo.headline")}</Modal.Title>
            <Modal.Section>
              <ImageCropper
                subject="organization"
                id="modal-logo-upload"
                uploadKey="logo"
                image={organization.logo || undefined}
                aspect={1}
                minCropWidth={100}
                minCropHeight={100}
                maxTargetWidth={288}
                maxTargetHeight={288}
                slug={organization.slug}
                redirect={pathname}
                modalSearchParam="modal-logo"
              >
                <Avatar
                  name={organization.name}
                  logo={organization.logo}
                  size="xl"
                  textSize="xl"
                />
              </ImageCropper>
            </Modal.Section>
          </Modal>
        </>
      )}
      {/* TabBar Section */}
      {hasAboutData(organization) ||
      hasNetworkData(organization) ||
      hasTeamData(organization) ||
      hasEventsData(organization) ||
      hasProjectsData(organization) ? (
        <Container.Section className="mv-py-6 @sm:mv-px-4 @lg:mv-px-6 mv-flex mv-flex-col mv-gap-4 @sm:mv-border @sm:mv-border-neutral-200 mv-bg-white @sm:mv-rounded-2xl">
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
