import { conform } from "@conform-to/react";
import { Image } from "@mint-vernetzt/components/src/molecules/Image";
import {
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "@remix-run/node";
import {
  Form,
  Link,
  Outlet,
  useLoaderData,
  useLocation,
  useMatches,
} from "@remix-run/react";
import rcSliderStyles from "rc-slider/assets/index.css?url";
import reactCropStyles from "react-image-crop/dist/ReactCrop.css?url";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { H1 } from "~/components/Heading/Heading";
import ImageCropper from "~/components/ImageCropper/ImageCropper";
import { Modal } from "~/components-next/Modal";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { ImageAspects, MaxImageSizes, MinCropSizes } from "~/images.shared";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValue } from "~/lib/utils/routes";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";
import { deriveProjectMode } from "../utils.server";
import { detectLanguage } from "~/i18n.server";
import { TextButton } from "@mint-vernetzt/components/src/molecules/TextButton";
import { Header } from "@mint-vernetzt/components/src/organisms/Header";
import { Status } from "@mint-vernetzt/components/src/molecules/Status";
import { Avatar } from "@mint-vernetzt/components/src/molecules/Avatar";
import { Controls } from "@mint-vernetzt/components/src/organisms/containers/Controls";
import { CircleButton } from "@mint-vernetzt/components/src/molecules/CircleButton";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { TabBar } from "@mint-vernetzt/components/src/organisms/TabBar";
import { languageModuleMap } from "~/locales/.server";

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
  if (data.project.excerpt === null && data.project.background === null) {
    return [
      {
        title: `MINTvernetzt Community Plattform | ${data.project.name}`,
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
  if (data.project.excerpt === null) {
    return [
      {
        title: `MINTvernetzt Community Plattform | ${data.project.name}`,
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
        content: data.project.background,
      },
      {
        property: "og:image:secure_url",
        content: data.project.background,
      },
      {
        property: "og:url",
        content: data.meta.url,
      },
    ];
  }
  if (data.project.background === null) {
    return [
      {
        title: `MINTvernetzt Community Plattform | ${data.project.name}`,
      },
      {
        name: "description",
        property: "og:description",
        content: data.project.excerpt,
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
      title: `MINTvernetzt Community Plattform | ${data.project.name}`,
    },
    {
      name: "description",
      property: "og:description",
      content: data.project.excerpt,
    },
    {
      name: "image",
      property: "og:image",
      content: data.project.background,
    },
    {
      property: "og:image:secure_url",
      content: data.project.background,
    },
    {
      property: "og:url",
      content: data.meta.url,
    },
  ];
};

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["project/$slug/detail"];

  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);
  const slug = getParamValue(params, "slug");
  invariantResponse(
    slug !== undefined,
    locales.route.error.invariant.undefinedSlug,
    {
      status: 404,
    }
  );

  const mode = await deriveProjectMode(sessionUser, slug);

  const project = await prismaClient.project.findUnique({
    select: {
      slug: true,
      name: true,
      subline: true,
      logo: true,
      published: true,
      background: true,
      timeframe: true,
      jobFillings: true,
      furtherJobFillings: true,
      yearlyBudget: true,
      financings: true,
      furtherFinancings: true,
      technicalRequirements: true,
      furtherTechnicalRequirements: true,
      roomSituation: true,
      furtherRoomSituation: true,
      documents: true,
      images: true,
      excerpt: true,
    },
    where: {
      slug,
    },
  });
  invariantResponse(
    project !== null,
    locales.route.error.invariant.projectNotFound,
    {
      status: 404,
    }
  );

  invariantResponse(
    project.published || mode === "admin",
    locales.route.error.invariant.projectNotPublished,
    { status: 403 }
  );

  let background;
  let blurredBackground;
  if (project.background !== null) {
    const publicURL = getPublicURL(authClient, project.background);
    if (publicURL) {
      background = getImageURL(publicURL, {
        resize: { type: "fill", ...ImageSizes.Project.Detail.Background },
      });
    }
    blurredBackground = getImageURL(publicURL, {
      resize: { type: "fill", ...ImageSizes.Project.Detail.BlurredBackground },
      blur: BlurFactor,
    });
  }
  let logo;
  let blurredLogo;
  if (project.logo !== null) {
    const publicURL = getPublicURL(authClient, project.logo);
    if (publicURL) {
      logo = getImageURL(publicURL, {
        resize: { type: "fill", ...ImageSizes.Project.Detail.Logo },
      });
    }
    blurredLogo = getImageURL(publicURL, {
      resize: { type: "fill", ...ImageSizes.Project.Detail.BlurredLogo },
      blur: BlurFactor,
    });
  }

  const enhancedProject = {
    ...project,
    background,
    blurredBackground,
    logo,
    blurredLogo,
  };

  return {
    project: enhancedProject,
    mode,
    meta: {
      baseUrl: process.env.COMMUNITY_BASE_URL,
      url: request.url,
    },
    locales,
  };
};

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["project/$slug/detail"];

  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);
  const slug = getParamValue(params, "slug");
  invariantResponse(
    slug !== undefined,
    locales.route.error.invariant.undefinedSlug,
    {
      status: 404,
    }
  );
  const mode = await deriveProjectMode(sessionUser, slug);
  invariantResponse(
    mode === "admin",
    locales.route.error.invariant.adminsOnly,
    {
      status: 403,
    }
  );

  const formData = await request.formData();
  const action = formData.get(conform.INTENT);
  invariantResponse(
    action !== null,
    locales.route.error.invariant.missingConfirmation,
    {
      status: 400,
    }
  );
  invariantResponse(
    typeof action === "string",
    locales.route.error.invariant.invalidIntent,
    {
      status: 400,
    }
  );
  if (action === "publish") {
    await prismaClient.project.update({
      where: {
        slug: slug,
      },
      data: {
        published: true,
      },
    });
    return { success: true };
  } else if (action === "unpublish") {
    await prismaClient.project.update({
      where: {
        slug: slug,
      },
      data: {
        published: false,
      },
    });
    return { success: true };
  }
  return { success: false };
};

function ProjectDetail() {
  const loaderData = useLoaderData<typeof loader>();
  const location = useLocation();
  const { project, mode, locales } = loaderData;
  const matches = useMatches();
  let pathname = "";

  const lastMatch = matches[matches.length - 1];

  if (typeof lastMatch.pathname !== "undefined") {
    pathname = lastMatch.pathname;
  }

  return (
    <>
      <section className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl mv-mb-2 @md:mv-mb-4 @md:mv-mt-2">
        <TextButton weight="thin" variant="neutral" arrowLeft>
          <Link to="/explore/projects" prefetch="intent">
            {locales.route.content.back}
          </Link>
        </TextButton>
      </section>
      <section className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl">
        <Header>
          {mode === "admin" && project.published === false && (
            <Status>{locales.route.content.draft}</Status>
          )}
          <Image
            src={project.background}
            alt={project.name}
            blurredSrc={project.blurredBackground}
          />
          <Avatar
            name={project.name}
            logo={project.logo}
            blurredLogo={project.blurredLogo}
            size="full"
            textSize="xl"
          />
          {mode === "admin" && (
            <Controls>
              <Form method="get" action={location.pathname} preventScrollReset>
                <input hidden name="modal-background" defaultValue="true" />
                {/* // TODO: Only the label is clickable in this scenario, but does not fill the entire CircleButton mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl */}
                <CircleButton type="submit" variant="outline">
                  <div className="mv-absolute mv-top-4 mv-left-4 mv-w-full mv-h-full mv-modal-button mv-cursor-pointer">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12.1464 0.146447C12.3417 -0.0488155 12.6583 -0.0488155 12.8536 0.146447L15.8536 3.14645C16.0488 3.34171 16.0488 3.65829 15.8536 3.85355L5.85355 13.8536C5.80567 13.9014 5.74857 13.9391 5.6857 13.9642L0.685695 15.9642C0.499987 16.0385 0.287878 15.995 0.146446 15.8536C0.00501511 15.7121 -0.0385219 15.5 0.0357614 15.3143L2.03576 10.3143C2.06091 10.2514 2.09857 10.1943 2.14645 10.1464L12.1464 0.146447ZM11.2071 2.5L13.5 4.79289L14.7929 3.5L12.5 1.20711L11.2071 2.5ZM12.7929 5.5L10.5 3.20711L4 9.70711V10H4.5C4.77614 10 5 10.2239 5 10.5V11H5.5C5.77614 11 6 11.2239 6 11.5V12H6.29289L12.7929 5.5ZM3.03165 10.6755L2.92612 10.781L1.39753 14.6025L5.21902 13.0739L5.32454 12.9683C5.13495 12.8973 5 12.7144 5 12.5V12H4.5C4.22386 12 4 11.7761 4 11.5V11H3.5C3.2856 11 3.10271 10.865 3.03165 10.6755Z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                </CircleButton>
              </Form>
            </Controls>
          )}
          <Header.Body>
            {mode === "admin" && (
              <Controls>
                <Form
                  method="get"
                  action={location.pathname}
                  preventScrollReset
                >
                  <input hidden name="modal-logo" defaultValue="true" />
                  <button
                    type="submit"
                    className="appearance-none flex content-center items-center nowrap cursor-pointer text-primary"
                  >
                    <svg
                      width="17"
                      height="16"
                      viewBox="0 0 17 16"
                      xmlns="http://www.w3.org/2000/svg"
                      className="fill-neutral-600"
                    >
                      <path d="M14.9 3.116a.423.423 0 0 0-.123-.299l-1.093-1.093a.422.422 0 0 0-.598 0l-.882.882 1.691 1.69.882-.882a.423.423 0 0 0 .123-.298Zm-3.293.087 1.69 1.69v.001l-5.759 5.76a.422.422 0 0 1-.166.101l-2.04.68a.211.211 0 0 1-.267-.267l.68-2.04a.423.423 0 0 1 .102-.166l5.76-5.76ZM2.47 14.029a1.266 1.266 0 0 1-.37-.895V3.851a1.266 1.266 0 0 1 1.265-1.266h5.486a.422.422 0 0 1 0 .844H3.366a.422.422 0 0 0-.422.422v9.283a.422.422 0 0 0 .422.422h9.284a.422.422 0 0 0 .421-.422V8.07a.422.422 0 0 1 .845 0v5.064a1.266 1.266 0 0 1-1.267 1.266H3.367c-.336 0-.658-.133-.895-.37Z" />
                    </svg>
                    <span className="ml-2">
                      {locales.route.content.changeImage}
                    </span>
                  </button>
                </Form>
              </Controls>
            )}
            <H1 like="h3" className="mv-mb-0">
              {project.name}
            </H1>
            {project.subline !== null && (
              <p className="mv-text-base @md:mv-text-2xl">{project.subline}</p>
            )}
          </Header.Body>
          {mode === "admin" && (
            <Header.Footer>
              <Controls>
                <Button as="a" href="./../settings" fullSize>
                  {locales.route.content.edit}
                </Button>
                <Button
                  name={conform.INTENT}
                  variant="outline"
                  value={`${project.published ? "unpublish" : "publish"}`}
                  type="submit"
                  form="publish-form"
                  fullSize
                >
                  {(() => {
                    let localeKey = project.published
                      ? ("hide" as const)
                      : ("show" as const);
                    return locales.route.content.publish[localeKey];
                  })()}
                </Button>
              </Controls>
            </Header.Footer>
          )}
        </Header>
        {mode === "admin" && (
          <Form method="post" id="publish-form" preventScrollReset />
        )}
      </section>
      {mode === "admin" && (
        <>
          <Modal searchParam="modal-background">
            <Modal.Title>
              {locales.route.cropper.background.headline}
            </Modal.Title>
            <Modal.Section>
              <ImageCropper
                subject="project"
                id="modal-background-upload"
                uploadKey="background"
                image={project.background || undefined}
                aspect={ImageAspects.Background}
                minCropWidth={MinCropSizes.Background.width}
                minCropHeight={MinCropSizes.Background.height}
                maxTargetWidth={MaxImageSizes.Background.width}
                maxTargetHeight={MaxImageSizes.Background.height}
                slug={project.slug}
                redirect={pathname}
                modalSearchParam="modal-background"
                locales={locales}
              >
                {project.background !== undefined ? (
                  <Image
                    src={project.background}
                    alt={project.name}
                    blurredSrc={project.blurredBackground}
                  />
                ) : (
                  <div className="mv-w-[300px] mv-min-h-[108px] mv-bg-attention-400 mv-rounded-md" />
                )}
              </ImageCropper>
            </Modal.Section>
          </Modal>
          <Modal searchParam="modal-logo">
            <Modal.Title>{locales.route.cropper.logo.headline}</Modal.Title>
            <Modal.Section>
              <ImageCropper
                subject="project"
                id="modal-logo-upload"
                uploadKey="logo"
                image={project.logo || undefined}
                aspect={ImageAspects.AvatarAndLogo}
                minCropWidth={MinCropSizes.AvatarAndLogo.width}
                minCropHeight={MinCropSizes.AvatarAndLogo.height}
                maxTargetWidth={MaxImageSizes.AvatarAndLogo.width}
                maxTargetHeight={MaxImageSizes.AvatarAndLogo.height}
                slug={project.slug}
                redirect={pathname}
                modalSearchParam="modal-logo"
                circularCrop={true}
                locales={locales}
              >
                <Avatar
                  name={project.name}
                  logo={project.logo}
                  blurredLogo={project.blurredLogo}
                  size="xl"
                  textSize="xl"
                />
              </ImageCropper>
            </Modal.Section>
          </Modal>
        </>
      )}
      <section
        id="tab-bar-container"
        className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl mv-overflow-hidden mv-mb-24"
      >
        <div className="@md:mv-flex @xl:mv-justify-center mv-mt-6">
          <div className="mv-flex mv-flex-col mv-gap-8 @xl:mv-w-2/3">
            <TabBar>
              <TabBar.Item active={pathname.endsWith("/about")}>
                <Link to="./about" preventScrollReset>
                  {locales.route.content.about}
                </Link>
              </TabBar.Item>
              {(project.timeframe !== null ||
                project.jobFillings !== null ||
                project.furtherJobFillings !== null ||
                project.yearlyBudget !== null ||
                project.financings.length !== 0 ||
                project.furtherFinancings !== null ||
                project.technicalRequirements !== null ||
                project.furtherTechnicalRequirements !== null ||
                project.roomSituation !== null ||
                project.furtherRoomSituation !== null) && (
                <TabBar.Item active={pathname.endsWith("/requirements")}>
                  <Link to="./requirements" preventScrollReset>
                    {locales.route.content.conditions}
                  </Link>
                </TabBar.Item>
              )}
              {(project.documents.length > 0 || project.images.length > 0) && (
                <TabBar.Item active={pathname.endsWith("/attachments")}>
                  <Link to="./attachments" preventScrollReset>
                    {locales.route.content.material}
                  </Link>
                </TabBar.Item>
              )}
            </TabBar>
            <Outlet />
          </div>
        </div>
      </section>
    </>
  );
}

export default ProjectDetail;
