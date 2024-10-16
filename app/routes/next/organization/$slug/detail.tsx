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
      innerContainerClassName="mv-w-full mv-py-4 mv-px-4 @lg:mv-py-8 @lg:mv-px-8 mv-flex mv-flex-col mv-gap-4 mv-mb-10 @sm:mv-mb-[72px] @lg:mv-mb-16 mv-max-w-screen-2xl"
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
        <div className="mv-w-full mv-h-[196px] @lg:mv-h-[168px]">
          <Image
            alt={`${t("header.image.alt")} ${organization.name}`}
            src={organization.background || undefined}
            blurredSrc={organization.blurredBackground}
            resizeType="fill"
          />
        </div>
        <div className="mv-w-full mv-px-4 @sm:mv-px-6 @md:mv-px-8 mv-pt-9 @lg:mv-pt-8 mv-pb-6 @sm:mv-pb-7 @md:mv-pb-8 mv-flex mv-flex-col @lg:mv-flex-row mv-items-center @lg:mv-items-start mv-gap-10 @lg:mv-gap-3 @lg:mv-justify-between">
          <div className="mv-flex mv-flex-col mv-items-center @lg:mv-items-start mv-gap-6 @lg:mv-flex-grow @lg:mv-w-full">
            <div className="mv-flex mv-flex-col mv-items-center @lg:mv-items-start mv-gap-2">
              {mode === "admin" ? (
                <div className="@lg:mv-hidden">
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
                <p className="mv-px-8 @lg:mv-px-0 mv-text-neutral-600 mv-text-lg mv-font-semibold mv-leading-6">
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
            <div className="mv-w-full @lg:mv-w-fit mv-grid @lg:mv-flex mv-grid-rows-1 mv-grid-cols-2 mv-gap-2">
              <Button
                as="a"
                href={`/organization/${organization.slug}/settings`}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12.1465 0.146447C12.3417 -0.0488155 12.6583 -0.0488155 12.8536 0.146447L15.8536 3.14645C16.0488 3.34171 16.0488 3.65829 15.8536 3.85355L5.85357 13.8536C5.80569 13.9014 5.74858 13.9391 5.68571 13.9642L0.68571 15.9642C0.500001 16.0385 0.287892 15.995 0.146461 15.8536C0.00502989 15.7121 -0.0385071 15.5 0.0357762 15.3143L2.03578 10.3143C2.06092 10.2514 2.09858 10.1943 2.14646 10.1464L12.1465 0.146447ZM11.2071 2.5L13.5 4.79289L14.7929 3.5L12.5 1.20711L11.2071 2.5ZM12.7929 5.5L10.5 3.20711L4.00001 9.70711V10H4.50001C4.77616 10 5.00001 10.2239 5.00001 10.5V11H5.50001C5.77616 11 6.00001 11.2239 6.00001 11.5V12H6.29291L12.7929 5.5ZM3.03167 10.6755L2.92614 10.781L1.39754 14.6025L5.21903 13.0739L5.32456 12.9683C5.13496 12.8973 5.00001 12.7144 5.00001 12.5V12H4.50001C4.22387 12 4.00001 11.7761 4.00001 11.5V11H3.50001C3.28561 11 3.10272 10.865 3.03167 10.6755Z"
                    fill="white"
                  />
                </svg>
                <span className="mv-ml-2">{t("header.controls.edit")}</span>
              </Button>
              <div className="@lg:mv-hidden mv-w-full">
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
        {mode === "admin" ? (
          <div className="mv-hidden @lg:mv-grid mv-absolute mv-top-0 mv-w-full mv-h-[196px] @lg:mv-h-[168px] mv-opacity-0 hover:mv-opacity-100 mv-bg-opacity-0 hover:mv-bg-opacity-70 mv-transition-all mv-bg-neutral-700 mv-grid-rows-1 mv-grid-cols-1 mv-place-items-center">
            <div className="mv-flex mv-flex-col mv-items-center mv-gap-4">
              <p className="mv-text-white mv-text-lg mv-font-bold">
                {t("header.controls.backgroundLong")}
              </p>
              <Button type="submit" form="modal-background-form">
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
                    {t("header.controls.backgroundEdit")}
                  </span>
                </div>
              </Button>
            </div>
          </div>
        ) : null}
        <div className="mv-absolute mv-top-14 @lg:mv-top-8 @lg:mv-left-8 mv-w-40 mv-h-40 mv-rounded-full mv-shadow-[0_4px_16px_0_rgba(0,0,0,0.12)]">
          <div className="mv-relative mv-w-full mv-full">
            <Avatar
              logo={organization.logo}
              name={organization.name}
              size="full"
              textSize="xl"
            />
            {mode === "admin" ? (
              <button
                type="submit"
                form="modal-logo-form"
                className="mv-hidden @lg:mv-grid mv-absolute mv-top-0 mv-w-full mv-h-full mv-rounded-full mv-opacity-0 hover:mv-opacity-100 mv-bg-opacity-0 hover:mv-bg-opacity-70 mv-transition-all mv-bg-neutral-700 mv-grid-rows-1 mv-grid-cols-1 mv-place-items-center mv-cursor-pointer"
              >
                <div className="mv-flex mv-flex-col mv-items-center mv-gap-1">
                  <div className="mv-w-8 mv-h-8 mv-rounded-full mv-bg-neutral-50 mv-flex mv-items-center mv-justify-center mv-border mv-border-primary mv-bg-opacity-100">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M15 12C15 12.5523 14.5523 13 14 13H2C1.44772 13 1 12.5523 1 12V6C1 5.44772 1.44772 5 2 5H3.17157C3.96722 5 4.73028 4.68393 5.29289 4.12132L6.12132 3.29289C6.30886 3.10536 6.56321 3 6.82843 3H9.17157C9.43679 3 9.69114 3.10536 9.87868 3.29289L10.7071 4.12132C11.2697 4.68393 12.0328 5 12.8284 5H14C14.5523 5 15 5.44772 15 6V12ZM2 4C0.895431 4 0 4.89543 0 6V12C0 13.1046 0.895431 14 2 14H14C15.1046 14 16 13.1046 16 12V6C16 4.89543 15.1046 4 14 4H12.8284C12.298 4 11.7893 3.78929 11.4142 3.41421L10.5858 2.58579C10.2107 2.21071 9.70201 2 9.17157 2H6.82843C6.29799 2 5.78929 2.21071 5.41421 2.58579L4.58579 3.41421C4.21071 3.78929 3.70201 4 3.17157 4H2Z"
                        fill="#154194"
                      />
                      <path
                        d="M8 11C6.61929 11 5.5 9.88071 5.5 8.5C5.5 7.11929 6.61929 6 8 6C9.38071 6 10.5 7.11929 10.5 8.5C10.5 9.88071 9.38071 11 8 11ZM8 12C9.933 12 11.5 10.433 11.5 8.5C11.5 6.567 9.933 5 8 5C6.067 5 4.5 6.567 4.5 8.5C4.5 10.433 6.067 12 8 12Z"
                        fill="#154194"
                      />
                      <path
                        d="M3 6.5C3 6.77614 2.77614 7 2.5 7C2.22386 7 2 6.77614 2 6.5C2 6.22386 2.22386 6 2.5 6C2.77614 6 3 6.22386 3 6.5Z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                  <p className="mv-text-white mv-text-sm mv-font-semibold mv-leading-4">
                    {t("header.controls.edit")}
                  </p>
                </div>
              </button>
            ) : null}
          </div>
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
        <>
          <Container.Section className="mv-pt-6 @sm:mv-px-4 @lg:mv-px-6 mv-flex mv-flex-col mv-gap-4 @sm:mv-border @sm:mv-border-neutral-200 mv-bg-white @sm:mv-rounded-t-2xl">
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
          </Container.Section>
          <Outlet />
        </>
      ) : null}
    </Container>
  );
}

export default ProjectDetail;
