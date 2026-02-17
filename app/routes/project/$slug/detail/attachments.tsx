import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Image } from "@mint-vernetzt/components/src/molecules/Image";
import { Link, useLoaderData, type LoaderFunctionArgs } from "react-router";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { invariantResponse } from "~/lib/utils/response";
import { prismaClient } from "~/prisma.server";
import { detectLanguage } from "~/i18n.server";
import { getPublicURL } from "~/storage.server";
import { MaterialList } from "~/components-next/MaterialList";
import { deriveProjectMode } from "../../utils.server";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { languageModuleMap } from "~/locales/.server";
import { hasContent } from "~/utils.shared";

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["project/$slug/detail/attachments"];

  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);
  const slug = getParamValueOrThrow(params, "slug");
  const mode = await deriveProjectMode(sessionUser, slug);

  invariantResponse(
    params.slug !== undefined,
    locales.error.invariant.invalidRoute,
    {
      status: 400,
    }
  );

  const project = await prismaClient.project.findFirst({
    where: {
      slug: params.slug,
    },
    select: {
      documents: {
        select: {
          document: {
            select: {
              id: true,
              title: true,
              path: true,
              filename: true,
              mimeType: true,
              sizeInMB: true,
              description: true,
              extension: true,
            },
          },
        },
      },
      images: {
        select: {
          image: {
            select: {
              id: true,
              title: true,
              path: true,
              filename: true,
              credits: true,
              sizeInMB: true,
              description: true,
              extension: true,
            },
          },
        },
      },
    },
  });

  invariantResponse(project !== null, locales.error.invariant.notFound, {
    status: 404,
  });

  const images = project.images.map((relation) => {
    const publicURL = getPublicURL(authClient, relation.image.path);
    const thumbnail = getImageURL(publicURL, {
      resize: { type: "fill", ...ImageSizes.Project.Detail.MaterialThumbnail },
    });
    const blurredThumbnail = getImageURL(publicURL, {
      resize: {
        type: "fill",
        ...ImageSizes.Project.Detail.BlurredMaterialThumbnail,
      },
      blur: BlurFactor,
    });
    return {
      ...relation,
      image: { ...relation.image, thumbnail, blurredThumbnail },
    };
  });

  const enhancedProject = {
    ...project,
    images,
  };

  return { project: enhancedProject, mode, locales };
}

function Attachments() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales } = loaderData;

  return (
    <>
      <h1 className="text-2xl @md:text-5xl font-bold text-primary mb-0">
        {locales.content.headline}
      </h1>
      <div className="flex flex-col gap-6">
        <h2 className="text-neutral-700 text-lg font-bold mb-0">
          {locales.content.documents.title}
        </h2>
        {loaderData.mode === "anon" ? (
          <p>{locales.content.documents.anonHint}</p>
        ) : null}
        {hasContent(loaderData.project.documents) ? (
          <>
            <MaterialList>
              {loaderData.project.documents.map((relation) => {
                return (
                  <MaterialList.Item key={relation.document.id}>
                    {relation.document.mimeType === "application/pdf" && (
                      <MaterialList.Item.PDFIcon />
                    )}
                    {relation.document.mimeType === "image/jpeg" && (
                      <MaterialList.Item.JPGIcon />
                    )}
                    <MaterialList.Item.Title>
                      {relation.document.title !== null
                        ? relation.document.title
                        : relation.document.filename}
                    </MaterialList.Item.Title>
                    <MaterialList.Item.Meta>
                      ({relation.document.extension},{" "}
                      {relation.document.sizeInMB} MB)
                    </MaterialList.Item.Meta>
                    {relation.document.description !== null && (
                      <MaterialList.Item.Paragraph>
                        {relation.document.description}
                      </MaterialList.Item.Paragraph>
                    )}
                    {loaderData.mode !== "anon" ? (
                      <div className="shrink-0 p-4 flex gap-2 @lg:gap-4 ml-auto">
                        <Link
                          to={`./download?type=document&id=${relation.document.id}`}
                          reloadDocument
                        >
                          <MaterialList.Item.Controls.Download />
                        </Link>
                      </div>
                    ) : null}
                  </MaterialList.Item>
                );
              })}
            </MaterialList>
            {loaderData.mode !== "anon" ? (
              <div className="w-full @md:max-w-fit">
                <Button
                  as="link"
                  to={`./download?type=documents`}
                  variant="outline"
                  fullSize
                  reloadDocument
                >
                  {locales.content.documents.downloadAll}
                </Button>
              </div>
            ) : null}
          </>
        ) : (
          <p>{locales.content.documents.empty}</p>
        )}
      </div>
      <div className="flex flex-col gap-6">
        <h2 className="text-neutral-700 text-lg font-bold mb-0">
          {locales.content.images.title}
        </h2>
        {hasContent(loaderData.project.images) ? (
          <>
            <MaterialList>
              {loaderData.project.images.map((relation) => {
                return (
                  <MaterialList.Item key={relation.image.id}>
                    <Image
                      src={relation.image.thumbnail}
                      blurredSrc={relation.image.blurredThumbnail}
                      alt={relation.image.description || ""}
                    />
                    <MaterialList.Item.Title>
                      {relation.image.title !== null
                        ? relation.image.title
                        : relation.image.filename}
                    </MaterialList.Item.Title>
                    <MaterialList.Item.Meta>
                      ({relation.image.extension}, {relation.image.sizeInMB} MB)
                    </MaterialList.Item.Meta>
                    {relation.image.description !== null && (
                      <MaterialList.Item.Paragraph>
                        {relation.image.description}
                      </MaterialList.Item.Paragraph>
                    )}
                    {relation.image.credits !== null && (
                      <MaterialList.Item.Paragraph>
                        Foto-Credit: {relation.image.credits}
                      </MaterialList.Item.Paragraph>
                    )}
                    <div className="shrink-0 p-4 flex gap-2 @lg:gap-4 ml-auto">
                      <Link
                        to={`./download?type=image&id=${relation.image.id}`}
                        reloadDocument
                      >
                        <MaterialList.Item.Controls.Download />
                      </Link>
                    </div>
                  </MaterialList.Item>
                );
              })}
            </MaterialList>
            <div className="w-full @md:max-w-fit">
              <Button
                as="link"
                to={`./download?type=images`}
                variant="outline"
                fullSize
                reloadDocument
              >
                {locales.content.images.downloadAll}
              </Button>
            </div>
          </>
        ) : (
          <p>{locales.content.images.empty}</p>
        )}
      </div>
    </>
  );
}

export default Attachments;
