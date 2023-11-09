import { redirect, type DataFunctionArgs, json } from "@remix-run/node";
import { useLoaderData, useLocation } from "@remix-run/react";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { BackButton } from "./__components";
import { getRedirectPathOnProtectedProjectRoute } from "./utils.server";
import { Section } from "@mint-vernetzt/components";
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

  invariantResponse(sessionUser !== null, "Not logged in", {
    status: 403,
  });

  const profile = await prismaClient.profile.findFirst({
    select: {
      firstName: true,
    },
    where: {
      id: sessionUser.id,
    },
  });

  invariantResponse(profile !== null, "Profile not found", {
    status: 404,
  });

  return json({ profile }, { headers: response.headers });
};

function Requirements() {
  const location = useLocation();
  const loaderData = useLoaderData<typeof loader>();

  return (
    <>
      <Section>
        <BackButton to={location.pathname}>Rahmenbedingungen</BackButton>
        <div className="mv-flex mv-flex-col mv-gap-6 md:mv-gap-4">
          <div className="md:mv-p-4 md:mv-border md:mv-rounded-lg md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-4">
              Noch in Bearbeitung...
            </h2>
            <p className="mv-mb-2">Hi {loaderData.profile.firstName},</p>
            <p className="mv-mb-2">
              dieser Bereich ist noch in Bearbeitung. Bald kannst Du hier der
              Community zeigen unter welchen Rahmenbedingungen das Projekt
              organisiert ist. Dazu gehören Informationen wie beispielsweise der
              zeitliche oder finanzielle Rahmen und noch viel mehr.
            </p>
            <p>Bis bald,</p>
            <p>Dein MINTvernetzt Team</p>
          </div>
        </div>
      </Section>
    </>
  );
}

export default Requirements;
