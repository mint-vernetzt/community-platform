import { type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { getRedirectPathOnProtectedProjectRoute } from "../utils.server";
import { prismaClient } from "~/prisma.server";
import JSZip from "jszip";
import i18next from "~/i18next.server";
import { detectLanguage } from "~/root.server";

const i18nNS = ["routes/project/settings/attachments/download"];
export const handle = {
  i18n: i18nNS,
};

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  const locale = detectLanguage(request);
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
        slug: true,
        documents: {
          select: {
            document: {
              select: {
                id: true,
                path: true,
                mimeType: true,
                filename: true,
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

      return new Response(buffer, {
        status: 200,
        headers: {
          "Content-Type": relation.document.mimeType,
          "Content-Disposition": `attachment; filename="${relation.document.filename}"`,
        },
      });
    } else {
      // TODO: no compression. maybe use different library
      const filename = `${project.slug}_documents.zip`;
      const zip = new JSZip();
      for (const relation of project.documents) {
        const result = await authClient.storage
          .from("documents")
          .download(relation.document.path);
        if (result.error === null) {
          const arrayBuffer = await result.data.arrayBuffer();
          zip.file(relation.document.filename, arrayBuffer);
        }
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
        slug: true,
        images: {
          select: {
            image: {
              select: {
                id: true,
                path: true,
                mimeType: true,
                filename: true,
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

      return new Response(buffer, {
        status: 200,
        headers: {
          "Content-Type": relation.image.mimeType,
          "Content-Disposition": `attachment; filename="${relation.image.filename}"`,
        },
      });
    } else {
      // TODO: no compression. maybe use different library
      const filename = `${project.slug}_images.zip`;
      const zip = new JSZip();
      for (const relation of project.images) {
        const result = await authClient.storage
          .from("images")
          .download(relation.image.path);
        if (result.error === null) {
          const arrayBuffer = await result.data.arrayBuffer();
          zip.file(relation.image.filename, arrayBuffer);
        }
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
