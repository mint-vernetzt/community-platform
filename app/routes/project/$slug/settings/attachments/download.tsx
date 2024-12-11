import { type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { getRedirectPathOnProtectedProjectRoute } from "../utils.server";
import { prismaClient } from "~/prisma.server";
import JSZip from "jszip";
import i18next from "~/i18next.server";
import { detectLanguage } from "~/root.server";
import { escapeFilenameSpecialChars } from "~/lib/string/escapeFilenameSpecialChars";

const i18nNS = ["routes-project-settings-attachments-download"] as const;
export const handle = {
  i18n: i18nNS,
};

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  const locale = await detectLanguage(request);
  const t = await i18next.getFixedT(locale, i18nNS);

  invariantResponse(params.slug !== undefined, t("error.invalidRoute"), {
    status: 400,
  });

  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);

  const redirectPath = await getRedirectPathOnProtectedProjectRoute({
    request,
    slug: params.slug,
    sessionUser,
    authClient,
  });

  if (redirectPath !== null) {
    return redirect(redirectPath);
  }

  const url = new URL(request.url);
  const type = url.searchParams.get("type") as
    | null
    | "document"
    | "image"
    | "documents"
    | "images";
  const fileId = url.searchParams.get("id");

  invariantResponse(
    type !== null &&
      (type === "document" ||
        type === "documents" ||
        type === "image" ||
        type === "images"),
    t("error.invalidParameters"),
    {
      status: 400,
    }
  );

  if (type === "document" || type === "documents") {
    const project = await prismaClient.project.findFirst({
      where: {
        slug: params.slug,
      },
      select: {
        name: true,
        documents: {
          select: {
            document: {
              select: {
                id: true,
                path: true,
                mimeType: true,
                filename: true,
                title: true,
              },
            },
          },
        },
      },
    });
    invariantResponse(project !== null, t("error.projectNotFound"), {
      status: 404,
    });

    if (type === "document") {
      const relation = project.documents.find((relation) => {
        return relation.document.id === fileId;
      });

      invariantResponse(
        typeof relation !== "undefined",
        t("error.documentNotFound"),
        {
          status: 404,
        }
      );

      const result = await authClient.storage
        .from("documents")
        .download(relation.document.path);

      invariantResponse(result.error === null, t("error.downloadFailed"), {
        status: 400,
      });

      const arrayBuffer = await result.data.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const escapedFilename = escapeFilenameSpecialChars(
        relation.document.title || relation.document.filename
      );

      return new Response(buffer, {
        status: 200,
        headers: {
          "Content-Type": relation.document.mimeType,
          "Content-Disposition": `attachment; filename="${escapedFilename}"`,
        },
      });
    } else {
      // TODO: no compression. maybe use different library
      const escapedProjectName = escapeFilenameSpecialChars(project.name);
      const filename = `${escapedProjectName} ${t("zipSuffix.documents")}`;
      const zip = new JSZip();
      let index = 0;
      for (const relation of project.documents) {
        const result = await authClient.storage
          .from("documents")
          .download(relation.document.path);
        if (result.error === null) {
          const arrayBuffer = await result.data.arrayBuffer();
          if (
            project.documents.some((otherRelation) => {
              return (
                relation.document.id !== otherRelation.document.id &&
                relation.document.filename === otherRelation.document.filename
              );
            })
          ) {
            zip.file(`${index + 1}_${relation.document.filename}`, arrayBuffer);
          } else {
            zip.file(relation.document.filename, arrayBuffer);
          }
        }
        index++;
      }
      const content = await zip.generateAsync({ type: "arraybuffer" });
      return new Response(content, {
        status: 200,
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }
  }
  if (type === "image" || type === "images") {
    const project = await prismaClient.project.findFirst({
      where: {
        slug: params.slug,
      },
      select: {
        name: true,
        images: {
          select: {
            image: {
              select: {
                id: true,
                path: true,
                mimeType: true,
                filename: true,
                title: true,
              },
            },
          },
        },
      },
    });

    invariantResponse(project !== null, t("error.projectNotFound"), {
      status: 404,
    });

    if (type === "image") {
      const relation = project.images.find((relation) => {
        return relation.image.id === fileId;
      });

      invariantResponse(
        typeof relation !== "undefined",
        t("error.documentNotFound"),
        {
          status: 404,
        }
      );

      const result = await authClient.storage
        .from("images")
        .download(relation.image.path);

      invariantResponse(result.error === null, t("error.downloadFailed"), {
        status: 400,
      });

      const arrayBuffer = await result.data.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const escapedFilename = escapeFilenameSpecialChars(
        relation.image.title || relation.image.filename
      );

      return new Response(buffer, {
        status: 200,
        headers: {
          "Content-Type": relation.image.mimeType,
          "Content-Disposition": `attachment; filename="${escapedFilename}"`,
        },
      });
    } else {
      // TODO: no compression. maybe use different library
      const escapedProjectName = escapeFilenameSpecialChars(project.name);
      const filename = `${escapedProjectName} ${t("zipSuffix.images")}`;
      const zip = new JSZip();
      let index = 0;
      for (const relation of project.images) {
        const result = await authClient.storage
          .from("images")
          .download(relation.image.path);
        if (result.error === null) {
          const arrayBuffer = await result.data.arrayBuffer();
          if (
            project.images.some((otherRelation) => {
              return (
                relation.image.id !== otherRelation.image.id &&
                relation.image.filename === otherRelation.image.filename
              );
            })
          ) {
            zip.file(`${index + 1}_${relation.image.filename}`, arrayBuffer);
          } else {
            zip.file(relation.image.filename, arrayBuffer);
          }
        }
        index++;
      }
      const content = await zip.generateAsync({ type: "arraybuffer" });
      return new Response(content, {
        status: 200,
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }
  }

  return null;
};
