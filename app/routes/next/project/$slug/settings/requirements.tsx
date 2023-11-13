import { redirect, type DataFunctionArgs, json } from "@remix-run/node";
import { useLoaderData, useLocation } from "@remix-run/react";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { BackButton } from "./__components";
import {
  getRedirectPathOnProtectedProjectRoute,
  getSubmissionHash,
} from "./utils.server";
import { Section } from "@mint-vernetzt/components";
import { prismaClient } from "~/prisma.server";
import { conform, list, useFieldList, useForm } from "@conform-to/react";
import { getFieldsetConstraint, parse } from "@conform-to/zod";
import { z } from "zod";

const requirementsSchema = z.object({
  timeframe: z
    .string()
    .max(
      200,
      "Deine Eingabe übersteigt die maximal zulässige Zeichenzahl von 200."
    )
    .optional()
    .transform((value) => (value === undefined ? null : value)),
  jobFillings: z
    .string()
    .max(
      500,
      "Deine Eingabe übersteigt die maximal zulässige Zeichenzahl von 500."
    )
    .optional()
    .transform((value) => (value === undefined ? null : value)),
  yearlyBudget: z
    .string()
    .max(
      80,
      "Deine Eingabe übersteigt die maximal zulässige Zeichenzahl von 80."
    )
    .optional()
    .transform((value) => (value === undefined ? null : value)),
  financings: z.array(z.string().uuid()),
  furtherFinancings: z
    .string()
    .max(
      500,
      "Deine Eingabe übersteigt die maximal zulässige Zeichenzahl von 500."
    )
    .optional()
    .transform((value) => (value === undefined ? null : value)),
  technicalRequirements: z
    .string()
    .max(
      500,
      "Deine Eingabe übersteigt die maximal zulässige Zeichenzahl von 500."
    )
    .optional()
    .transform((value) => (value === undefined ? null : value)),
  furtherTechnicalRequirements: z
    .string()
    .max(
      500,
      "Deine Eingabe übersteigt die maximal zulässige Zeichenzahl von 500."
    )
    .optional()
    .transform((value) => (value === undefined ? null : value)),
  roomSituation: z
    .string()
    .max(
      200,
      "Deine Eingabe übersteigt die maximal zulässige Zeichenzahl von 200."
    )
    .optional()
    .transform((value) => (value === undefined ? null : value)),
  furtherRoomSituation: z
    .string()
    .max(
      200,
      "Deine Eingabe übersteigt die maximal zulässige Zeichenzahl von 200."
    )
    .optional()
    .transform((value) => (value === undefined ? null : value)),
});

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

  const project = await prismaClient.project.findUnique({
    select: {
      timeframe: true,
      jobFillings: true,
      yearlyBudget: true,
      furtherFinancings: true,
      technicalRequirements: true,
      furtherTechnicalRequirements: true,
      roomSituation: true,
      furtherRoomSituation: true,
      financings: {
        select: {
          financing: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
    },
    where: {
      slug: params.slug,
    },
  });
  invariantResponse(project !== null, "Project not found", {
    status: 404,
  });

  const allFinancings = await prismaClient.financing.findMany({
    select: {
      id: true,
      title: true,
    },
  });

  return json({ project, allFinancings }, { headers: response.headers });
};

export async function action({ request, params }: DataFunctionArgs) {
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
  const project = await prismaClient.project.findUnique({
    select: {
      id: true,
    },
    where: {
      slug: params.slug,
    },
  });
  invariantResponse(project !== null, "Project not found", {
    status: 404,
  });
  // Validation
  const formData = await request.formData();
  const submission = await parse(formData, {
    schema: (intent) =>
      requirementsSchema.transform(async (data, ctx) => {
        if (intent !== "submit") return { ...data };

        const { financings, ...rest } = data;

        try {
          await prismaClient.project.update({
            where: {
              slug: params.slug,
            },
            data: {
              ...rest,
              financings: {
                deleteMany: {},
                connectOrCreate: financings.map((financingId: string) => {
                  return {
                    where: {
                      financingId_projectId: {
                        financingId: financingId,
                        projectId: project.id,
                      },
                    },
                    create: {
                      financingId,
                    },
                  };
                }),
              },
            },
          });
        } catch (e) {
          console.warn(e);
          ctx.addIssue({
            code: "custom",
            message:
              "Die Daten konnten nicht gespeichert werden. Bitte versuche es erneut oder wende dich an den Support.",
          });
          return z.NEVER;
        }

        return { ...data };
      }),
    async: true,
  });

  const hash = getSubmissionHash(submission);

  if (submission.intent !== "submit") {
    return json({ status: "idle", submission, hash } as const, {
      headers: response.headers,
    });
  }
  if (!submission.value) {
    return json({ status: "error", submission, hash } as const, {
      status: 400,
      headers: response.headers,
    });
  }

  return json({ status: "success", submission, hash } as const, {
    headers: response.headers,
  });
}

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
            <p className="mv-mb-2">Hi Colin,</p>
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
