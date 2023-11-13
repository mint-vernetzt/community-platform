import { useParams } from "@remix-run/react";
import { json, type DataFunctionArgs } from "@remix-run/server-runtime";
import { createAuthClient } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { prismaClient } from "~/prisma.server";

export const loader = async (args: DataFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);

  // check slug exists (throw bad request if not)
  invariantResponse(params.slug !== undefined, "No valid route", {
    status: 400,
  });

  const project = await prismaClient.project.findFirst({
    where: {
      slug: params.slug,
    },
    select: {
      timeframe: true,
      jobFillings: true,
      yearlyBudget: true,
      technicalRequirements: true,
      furtherTechnicalRequirements: true,
      roomSituation: true,
      furtherRoomSituation: true,
      financings: {
        select: {
          financing: {
            select: {
              title: true,
            },
          },
        },
      },
    },
  });

  invariantResponse(project !== null, "Not found", {
    status: 404,
  });

  return json({ project }, { headers: response.headers });
};

function Requirements() {
  const params = useParams();

  return <h1>/next/project/{params.slug}/detail/requirements</h1>;
}

export default Requirements;
