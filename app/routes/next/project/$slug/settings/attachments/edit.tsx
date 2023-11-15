import { DataFunctionArgs, json, redirect } from "@remix-run/node";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { getRedirectPathOnProtectedProjectRoute } from "../utils.server";
import { prismaClient } from "~/prisma.server";
import { useLoaderData, useSearchParams } from "@remix-run/react";
import { Section } from "@mint-vernetzt/components";

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
      (type === "document" || type === "image") &&
      fileId !== null,
    "Wrong or missing parameters",
    {
      status: 400,
    }
  );

  const project = await prismaClient.project.findFirst({
    where: {
      slug: params.slug,
    },
    select: {
      id: true,
    },
  });

  invariantResponse(project !== null, "Project not found", { status: 404 });

  let file;
  if (type === "document") {
    file = await prismaClient.documentOfProject.findFirst({
      where: {
        documentId: fileId,
        projectId: project.id,
      },
      select: {
        document: {
          select: {
            title: true,
            description: true,
          },
        },
      },
    });
  } else {
    file = await prismaClient.imageOfProject.findFirst({
      where: {
        imageId: fileId,
        projectId: project.id,
      },
      select: {
        image: {
          select: {
            title: true,
            description: true,
            credits: true,
          },
        },
      },
    });
  }

  invariantResponse(file !== null, "File not found", { status: 404 });

  return json(file, { headers: response.headers });
};

function Edit() {
  const loaderData = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();

  const type = searchParams.get("type");

  return (
    <div className="mv-absolute mv-top-0 mv-left-0 mv-z-10 mv-w-full mv-min-h-full mv-bg-white mv-flex mv-justify-center mv-items-center mv-bg-opacity-50">
      <Section as="div">
        <div className="mv-text-2xl mv-font-semibold mv-mb-4">
          {type === "document"
            ? "Dokument edititeren"
            : "Fotoinformation edititeren"}
        </div>
      </Section>
    </div>
  );
}

export default Edit;
