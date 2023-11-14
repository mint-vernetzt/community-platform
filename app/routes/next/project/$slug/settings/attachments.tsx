import { redirect, type DataFunctionArgs, json } from "@remix-run/node";
import { useLocation } from "@remix-run/react";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { BackButton } from "./__components";
import { getRedirectPathOnProtectedProjectRoute } from "./utils.server";
import { prismaClient } from "~/prisma.server";

export const loader = async (args: DataFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);

  const sessionUser = await getSessionUser(authClient);

  // check slug exists (throw bad request if not)
  invariantResponse(params.slug !== undefined, "No valid route", {
    status: 400,
  });

  const redirectPath = await getRedirectPathOnProtectedProjectRoute({
    request,
    slug: params.slug,
    sessionUser,
    authClient,
  });

  if (redirectPath !== null) {
    return redirect(redirectPath, { headers: response.headers });
  }

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
              filename: true,
              sizeInMB: true,
            },
          },
        },
      },
      images: {
        select: {
          image: {
            select: {
              id: true,
              name: true,
              alt: true,
              path: true,
              credits: true,
              sizeInMB: true,
            },
          },
        },
      },
    },
  });

  console.log({ project });

  return json(project, { headers: response.headers });
};

function Attachments() {
  const location = useLocation();

  return (
    <>
      <BackButton to={location.pathname}>Material verwalten</BackButton>
      <h1>{location.pathname}</h1>
    </>
  );
}

export default Attachments;
