import { Link, useLoaderData, useParams } from "@remix-run/react";
import { type DataFunctionArgs, json } from "@remix-run/node";
import { createAuthClient } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { prismaClient } from "~/prisma.server";
import { MaterialList } from "../settings/__components";
import { Button, Image } from "@mint-vernetzt/components";
import { getPublicURL } from "~/storage.server";
import { getImageURL } from "~/images.server";

export async function loader(args: DataFunctionArgs) {
  const { request, params } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);

  invariantResponse(params.slug !== undefined, "No valid route", {
    status: 400,
  });

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

  invariantResponse(project !== null, "Not found", {
    status: 404,
  });

  project.images = project.images.map((relation) => {
    const publicURL = getPublicURL(authClient, relation.image.path);
    const thumbnail = getImageURL(publicURL, {
      resize: { type: "fill", width: 144 },
    });
    return { ...relation, image: { ...relation.image, thumbnail } };
  });

  return json({ project }, { headers: response.headers });
}

function Attachments() {
  const params = useParams();
  const loaderData = useLoaderData<typeof loader>();

  return (
    <>
      <h1 className="mv-text-2xl md:mv-text-5xl mv-font-bold mv-text-primary mv-mb-0">
        Material zum Download
      </h1>
      <div className="mv-flex mv-flex-col mv-gap-6">
        <h2 className="mv-text-neutral-700 mv-text-lg mv-font-bold mv-mb-0">
          Dokumente
        </h2>
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
                    <div className="mv-shrink-0 mv-p-4 mv-flex mv-gap-2 lg:mv-gap-4 mv-ml-auto">
                      <Link
                        to={`./download?type=document&id=${relation.document.id}`}
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
                href={`./attachments/download?type=documents`}
                variant="outline"
                fullSize
              >
                Alle herunterladen
              </Button>
            </div>
          </>
        ) : (
          <p>Keine Dokumente vorhanden.</p>
        )}
      </div>
      <div className="mv-flex mv-flex-col mv-gap-6">
        <h2 className="mv-text-neutral-700 mv-text-lg mv-font-bold mv-mb-0">
          Bilder
        </h2>
        {loaderData.project.images.length > 0 ? (
          <>
            <MaterialList>
              {loaderData.project.images.map((relation) => {
                return (
                  <MaterialList.Item key={relation.image.id}>
                    {typeof relation.image.thumbnail !== "undefined" && (
                      <Image
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
                Alle herunterladen
              </Button>
            </div>
          </>
        ) : (
          <p>Keine Dokumente vorhanden.</p>
        )}
      </div>
    </>
  );
}

export default Attachments;
