import { Chip } from "@mint-vernetzt/components";
import { useLoaderData } from "@remix-run/react";
import { json, type LoaderFunctionArgs } from "@remix-run/server-runtime";
import { RichText } from "~/components/Richtext/RichText";
import { invariantResponse } from "~/lib/utils/response";
import { prismaClient } from "~/prisma.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { params } = args;

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
      furtherJobFillings: true,
      yearlyBudget: true,
      technicalRequirements: true,
      furtherTechnicalRequirements: true,
      roomSituation: true,
      furtherRoomSituation: true,
      furtherFinancings: true,
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

  return json({ project });
};

function Requirements() {
  const loaderData = useLoaderData<typeof loader>();
  const { project } = loaderData;

  return (
    <>
      <p className="mv-font-normal mv-text-neutral-800">
        Die Informationen zu finanziellem und personellem Rahmen beziehen sich
        auf das angegebene Projekt, nicht allgemein auf die Organisation.
      </p>

      {project.timeframe === null &&
        project.jobFillings === null &&
        project.furtherJobFillings === null &&
        project.yearlyBudget === null &&
        project.financings.length === 0 &&
        project.furtherFinancings === null &&
        project.technicalRequirements === null &&
        project.furtherTechnicalRequirements === null &&
        project.roomSituation === null &&
        project.furtherRoomSituation === null && (
          <p className="mv-font-normal mv-text-neutral-800">
            Informationen zu den Rahmenbedingungen wurden noch nicht eingetragen
          </p>
        )}
      {project.timeframe !== null && (
        <>
          <h2 className="mv-text-2xl md:mv-text-5xl mv-font-bold mv-text-primary mv-mb-0">
            Zeitlicher Rahmen
          </h2>
          <h3 className="mv-text-neutral-700 mv-text-lg mv-font-bold mv-mb-0">
            Projektstart bzw. Projekt-Zeitraum
          </h3>
          <RichText html={project.timeframe} />
        </>
      )}
      {(project.jobFillings !== null ||
        project.furtherJobFillings !== null) && (
        <>
          <h2 className="mv-text-2xl md:mv-text-5xl mv-font-bold mv-text-primary mv-mb-0">
            Personelle Situation
          </h2>
          {project.jobFillings !== null && (
            <>
              <h3 className="mv-text-neutral-700 mv-text-lg mv-font-bold mv-mb-0">
                Stellen und / oder Stundenkontingent
              </h3>
              <RichText html={project.jobFillings} />
            </>
          )}
          {project.furtherJobFillings !== null && (
            <>
              <h3 className="mv-text-neutral-700 mv-text-lg mv-font-bold mv-mb-0">
                Weitere Infos
              </h3>
              <RichText html={project.furtherJobFillings} />
            </>
          )}
        </>
      )}
      {(project.yearlyBudget !== null ||
        project.financings.length > 0 ||
        project.furtherFinancings !== null) && (
        <>
          <h2 className="mv-text-2xl md:mv-text-5xl mv-font-bold mv-text-primary mv-mb-0">
            Finanzieller Rahmen
          </h2>
          {project.yearlyBudget !== null && (
            <>
              <h3 className="mv-text-neutral-700 mv-text-lg mv-font-bold mv-mb-0">
                Jährliches Budget
              </h3>
              <p className="mv-font-normal mv-text-neutral-800">
                {project.yearlyBudget}
              </p>
            </>
          )}
          {project.financings.length > 0 && (
            <div className="mv-flex mv-flex-col mv-gap-4">
              <h3 className="mv-text-neutral-700 mv-text-lg mv-font-bold mv-mb-0">
                Art der Finanzierung
              </h3>
              <Chip.Container>
                {project.financings.map((relation) => {
                  return (
                    <Chip key={relation.financing.title} color="primary">
                      {relation.financing.title}
                    </Chip>
                  );
                })}
              </Chip.Container>
            </div>
          )}
          {project.furtherFinancings !== null && (
            <>
              <h3 className="mv-text-neutral-700 mv-text-lg mv-font-bold mv-mb-0">
                Weitere Infos
              </h3>
              <RichText html={project.furtherFinancings} />
            </>
          )}
        </>
      )}
      {(project.technicalRequirements !== null ||
        project.furtherTechnicalRequirements !== null) && (
        <>
          <h2 className="mv-text-2xl md:mv-text-5xl mv-font-bold mv-text-primary mv-mb-0">
            Technischer Rahmen
          </h2>
          {project.technicalRequirements !== null && (
            <>
              <h3 className="mv-text-neutral-700 mv-text-lg mv-font-bold mv-mb-0">
                Software / Hardware / Bausätze / Maschinen
              </h3>
              <RichText html={project.technicalRequirements} />
            </>
          )}
          {project.furtherTechnicalRequirements !== null && (
            <>
              <h3 className="mv-text-neutral-700 mv-text-lg mv-font-bold mv-mb-0">
                Sonstiges
              </h3>
              <RichText html={project.furtherTechnicalRequirements} />
            </>
          )}
        </>
      )}
      {(project.roomSituation !== null ||
        project.furtherRoomSituation !== null) && (
        <>
          <h2 className="mv-text-2xl md:mv-text-5xl mv-font-bold mv-text-primary mv-mb-0">
            Räumliche Situation
          </h2>
          {project.roomSituation !== null && (
            <>
              <h3 className="mv-text-neutral-700 mv-text-lg mv-font-bold mv-mb-0">
                Arbeitsorte
              </h3>
              <RichText html={project.roomSituation} />
            </>
          )}
          {project.furtherRoomSituation !== null && (
            <>
              <h3 className="mv-text-neutral-700 mv-text-lg mv-font-bold mv-mb-0">
                Weitere Informationen
              </h3>
              <RichText html={project.furtherRoomSituation} />
            </>
          )}
        </>
      )}
    </>
  );
}

export default Requirements;
