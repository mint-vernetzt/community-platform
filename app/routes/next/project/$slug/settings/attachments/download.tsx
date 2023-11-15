import { DataFunctionArgs, redirect } from "@remix-run/node";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { getRedirectPathOnProtectedProjectRoute } from "../utils.server";
import { prismaClient } from "~/prisma.server";

export const loader = async (args: DataFunctionArgs) => {
  const { request, params } = args;

  invariantResponse(params.slug !== undefined, "No valid route", {
    status: 400,
  });

  const response = new Response();
  const authClient = createAuthClient(request, response);
  const sessionUser = await getSessionUser(authClient);

  const redirectPath = await getRedirectPathOnProtectedProjectRoute({
    request,
    slug: params.slug,
    sessionUser,
    authClient,
  });

  if (redirectPath !== null) {
    return redirect(redirectPath, { headers: response.headers });
  }

  const url = new URL(request.url);
  const type = url.searchParams.get("type") as null | "document" | "image";
  const fileId = url.searchParams.get("id");

  invariantResponse(
    type !== null &&
      fileId !== null &&
      (type === "document" || type === "image"),
    "Wrong or missing parameters",
    {
      status: 400,
    }
  );

  if (type === "document") {
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
                path: true,
                mimeType: true,
                filename: true,
              },
            },
          },
        },
      },
    });
    invariantResponse(project !== null, "Project not found", { status: 404 });

    const relation = project.documents.find((relation) => {
      return relation.document.id === fileId;
    });

    invariantResponse(typeof relation !== "undefined", "Document not found", {
      status: 404,
    });

    const result = await authClient.storage
      .from("documents")
      .download(relation.document.path);

    invariantResponse(
      result.error === null,
      "Downloading from storage failed",
      {
        status: 400,
      }
    );

    const arrayBuffer = await result.data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new Response(buffer, {
      status: 200,
      headers: {
        ...response.headers,
        "Content-Type": relation.document.mimeType,
        "Content-Disposition": `attachment; filename="${relation.document.filename}"`,
      },
    });
  }

  if (type === "image") {
    const project = await prismaClient.project.findFirst({
      where: {
        slug: params.slug,
      },
      select: {
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
    invariantResponse(project !== null, "Project not found", { status: 404 });

    const relation = project.images.find((relation) => {
      return relation.image.id === fileId;
    });

    invariantResponse(typeof relation !== "undefined", "Document not found", {
      status: 404,
    });

    const result = await authClient.storage
      .from("documents")
      .download(relation.image.path);

    invariantResponse(
      result.error === null,
      "Downloading from storage failed",
      {
        status: 400,
      }
    );

    const arrayBuffer = await result.data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new Response(buffer, {
      status: 200,
      headers: {
        ...response.headers,
        "Content-Type": relation.image.mimeType,
        "Content-Disposition": `attachment; filename="${relation.image.filename}"`,
      },
    });
  }

  return null;
};
