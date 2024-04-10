import { Button, Image } from "@mint-vernetzt/components";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { createAuthClient, getSessionUser } from "~/auth.server";
import i18next from "~/i18next.server";
import { getImageURL } from "~/images.server";
import { invariantResponse } from "~/lib/utils/response";
import { prismaClient } from "~/prisma.server";
import { detectLanguage } from "~/root.server";
import { getPublicURL } from "~/storage.server";
import { MaterialList } from "../settings/__components";
import { deriveProjectMode } from "../../utils.server";
import { getParamValueOrThrow } from "~/lib/utils/routes";

const i18nNS = ["routes/project/detail/attachments"];
export const handle = {
  i18n: i18nNS,
};

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;

  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, i18nNS);

  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);
  const slug = getParamValueOrThrow(params, "slug");
  const mode = await deriveProjectMode(sessionUser, slug);

  invariantResponse(
    params.slug !== undefined,
    t("error.invatiant.invalidRoute"),
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

  invariantResponse(project !== null, t("error.invariant.notFound"), {
    status: 404,
  });

  project.images = project.images.map((relation) => {
    const publicURL = getPublicURL(authClient, relation.image.path);
    const thumbnail = getImageURL(publicURL, {
      resize: { type: "fill", width: 144 },
    });
    return { ...relation, image: { ...relation.image, thumbnail } };
  });

  return json({ project, mode });
}

function Attachments() {
  const loaderData = useLoaderData<typeof loader>();
  const { t } = useTranslation(i18nNS);

  return (
    <>
      <h1 className="mv-text-2xl md:mv-text-5xl mv-font-bold mv-text-primary mv-mb-0">
        {t("content.headline")}
      </h1>
      <div className="mv-flex mv-flex-col mv-gap-6">
        <h2 className="mv-text-neutral-700 mv-text-lg mv-font-bold mv-mb-0">
          {t("content.documents.title")}
        </h2>
        {loaderData.mode === "anon" ? (
          <p>{t("content.documents.anonHint")}</p>
        ) : null}
        {loaderData.project.documents.length > 0 ? (
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
                      <div className="mv-shrink-0 mv-p-4 mv-flex mv-gap-2 lg:mv-gap-4 mv-ml-auto">
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
              <div className="mv-w-full md:mv-max-w-fit">
                {/* TODO: Button as wrapper for Link (better relative path) */}
                <Button
                  as="a"
                  href={`./attachments/download?type=documents`}
                  variant="outline"
                  fullSize
                >
                  {t("content.documents.downloadAll")}
                </Button>
              </div>
            ) : null}
          </>
        ) : (
          <p>{t("content.documents.empty")}</p>
        )}
      </div>
      <div className="mv-flex mv-flex-col mv-gap-6">
        <h2 className="mv-text-neutral-700 mv-text-lg mv-font-bold mv-mb-0">
          {t("content.images.title")}
        </h2>
        {loaderData.project.images.length > 0 ? (
          <>
            <MaterialList>
              {loaderData.project.images.map((relation) => {
                return (
                  <MaterialList.Item key={relation.image.id}>
                    {/* TODO: fix type issue */}
                    {/* @ts-ignore */}
                    {typeof relation.image.thumbnail !== "undefined" && (
                      <Image
                        // @ts-ignore
                        src={relation.image.thumbnail}
                        alt={relation.image.description || ""}
                      />
                    )}
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
                    <div className="mv-shrink-0 mv-p-4 mv-flex mv-gap-2 lg:mv-gap-4 mv-ml-auto">
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
            <div className="mv-w-full md:mv-max-w-fit">
              {/* TODO: Button as wrapper for Link (better relative path) */}
              <Button
                as="a"
                href={`./attachments/download?type=images`}
                variant="outline"
                fullSize
              >
                {t("content.images.downloadAll")}
              </Button>
            </div>
          </>
        ) : (
          <p>{t("content.images.empty")}</p>
        )}
      </div>
    </>
  );
}

export default Attachments;
