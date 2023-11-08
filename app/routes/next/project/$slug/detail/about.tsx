import { Chip, Video } from "@mint-vernetzt/components";
import { json, type DataFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { createAuthClient } from "~/auth.server";
import { RichText } from "~/components/Richtext/RichText";
import { invariantResponse } from "~/lib/utils/response";
import { prismaClient } from "~/prisma.server";

export const loader = async (args: DataFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();

  createAuthClient(request, response);

  // check slug exists (throw bad request if not)
  invariantResponse(params.slug !== undefined, "No valid route", {
    status: 400,
  });

  const project = await prismaClient.project.findFirst({
    where: {
      slug: params.slug,
    },
    select: {
      name: true,
      excerpt: true,
      formats: {
        select: {
          format: {
            select: {
              title: true,
            },
          },
        },
      },
      furtherFormats: true,
      disciplines: {
        select: {
          discipline: {
            select: {
              title: true,
            },
          },
        },
      },
      furtherDisciplines: true,
      targetGroups: {
        select: {
          targetGroup: {
            select: {
              title: true,
            },
          },
        },
      },
      specialTargetGroups: {
        select: {
          specialTargetGroup: {
            select: {
              title: true,
            },
          },
        },
      },
      targetGroupAdditions: true,
      participantLimit: true,
      areas: {
        select: {
          area: {
            select: {
              name: true,
            },
          },
        },
      },
      furtherDescription: true,
      idea: true,
      goals: true,
      implementation: true,
      targeting: true,
      hints: true,
      video: true,
      videoSubline: true,
    },
  });

  invariantResponse(project !== null, "Not found", {
    status: 404,
  });

  console.log(project);

  return json({ project }, { headers: response.headers });
};

function About() {
  const loaderData = useLoaderData<typeof loader>();

  return (
    <>
      <h1 className="mv-text-primary md:mv-font-bold lg:mv-font-black mv-text-5xl lg:mv-text-7xl mb-0">
        {loaderData.project.name}
      </h1>
      {loaderData.project.excerpt !== null && (
        <p className="mv-font-semibold mv-text-lg lg:mv-text-2xl mv-text-neutral-700">
          {loaderData.project.excerpt}
        </p>
      )}
      {loaderData.project.formats.length > 0 && (
        <div className="mv-flex mv-flex-col mv-gap-4">
          <h3 className="mv-text-neutral-700 mv-text-lg mv-font-bold mv-mb-0">
            Format
          </h3>
          <Chip.Container>
            {loaderData.project.formats.map((relation) => {
              return (
                <Chip key={relation.format.title} color="primary">
                  {relation.format.title}
                </Chip>
              );
            })}
          </Chip.Container>
        </div>
      )}
      {loaderData.project.furtherFormats.length > 0 && (
        <div className="mv-flex mv-flex-col mv-gap-4">
          <h3 className="mv-text-neutral-700 mv-text-lg mv-font-bold mv-mb-0">
            Weitere Formate
          </h3>
          <div className="mv-flex mv-flex-wrap mv-gap-2">
            {loaderData.project.furtherFormats.map((format, index) => {
              return (
                <span
                  key={index}
                  className="mv-font-normal mv-text-neutral-800"
                >
                  {format}
                </span>
              );
            })}
          </div>
        </div>
      )}
      {loaderData.project.disciplines.length > 0 && (
        <div className="mv-flex mv-flex-col mv-gap-4">
          <h3 className="mv-text-neutral-700 mv-text-lg mv-font-bold mv-mb-0">
            MINT-Disziplin(en)
          </h3>
          <Chip.Container>
            {loaderData.project.disciplines.map((relation) => {
              return (
                <Chip key={relation.discipline.title} color="primary">
                  {relation.discipline.title}
                </Chip>
              );
            })}
          </Chip.Container>
        </div>
      )}
      {loaderData.project.furtherDisciplines.length > 0 && (
        <div className="mv-flex mv-flex-col mv-gap-4">
          <h3 className="mv-text-neutral-700 mv-text-lg mv-font-bold mv-mb-0">
            Erläuterungen zu den Disziplinen / Das Angebot beinhaltet folgende
            Teilgebiete
          </h3>
          <div className="mv-flex mv-flex-wrap mv-gap-2">
            <ul className="mv-list-disc mv-list-inside mv-font-normal mv-text-neutral-800 mv-px-2">
              {loaderData.project.furtherDisciplines.map((format, index) => {
                return <li key={index}>{format}</li>;
              })}
            </ul>
          </div>
        </div>
      )}
      {loaderData.project.targetGroups.length > 0 && (
        <div className="mv-flex mv-flex-col mv-gap-4">
          <h3 className="mv-text-neutral-700 mv-text-lg mv-font-bold mv-mb-0">
            Zielgruppe(n)
          </h3>
          <Chip.Container>
            {loaderData.project.targetGroups.map((relation) => {
              return (
                <Chip key={relation.targetGroup.title} color="primary">
                  {relation.targetGroup.title}
                </Chip>
              );
            })}
          </Chip.Container>
        </div>
      )}
      {loaderData.project.specialTargetGroups.length > 0 && (
        <div className="mv-flex mv-flex-col mv-gap-4">
          <h3 className="mv-text-neutral-700 mv-text-lg mv-font-bold mv-mb-0">
            Spezifische Zielgruppe(n)
          </h3>
          <Chip.Container>
            {loaderData.project.specialTargetGroups.map((relation) => {
              return (
                <Chip key={relation.specialTargetGroup.title} color="primary">
                  {relation.specialTargetGroup.title}
                </Chip>
              );
            })}
          </Chip.Container>
        </div>
      )}
      {loaderData.project.targetGroupAdditions !== null && (
        <div className="mv-flex mv-flex-col mv-gap-4">
          <h3 className="mv-text-neutral-700 mv-text-lg mv-font-bold mv-mb-0">
            Weitere Ergänzungen
          </h3>
          <p className="mv-font-normal mv-text-neutral-800">
            {loaderData.project.targetGroupAdditions}
          </p>
        </div>
      )}
      {loaderData.project.participantLimit !== null && (
        <div className="mv-flex mv-flex-col mv-gap-4">
          <h3 className="mv-text-neutral-700 mv-text-lg mv-font-bold mv-mb-0">
            Teilnehmer:innenzahl
          </h3>
          <p className="mv-font-normal mv-text-neutral-800">
            {loaderData.project.participantLimit}
          </p>
        </div>
      )}
      {loaderData.project.areas.length > 0 && (
        <div className="mv-flex mv-flex-col mv-gap-4">
          <h3 className="mv-text-neutral-700 mv-text-lg mv-font-bold mv-mb-0">
            Aktivitätsgebiet(e)
          </h3>
          <p className="mv-font-normal mv-text-neutral-800">
            {loaderData.project.areas
              .map((relation) => relation.area.name)
              .join(" / ")}
          </p>
        </div>
      )}
      {(loaderData.project.furtherDescription !== null ||
        loaderData.project.idea !== null ||
        loaderData.project.goals !== null ||
        loaderData.project.implementation !== null ||
        loaderData.project.targeting !== null ||
        loaderData.project.hints !== null) && (
        <>
          <h2 className="mv-text-2xl md:mv-text-5xl mv-font-bold mv-text-primary mv-mb-0">
            Projektbeschreibung
          </h2>
          {/* only further description */}
          {loaderData.project.furtherDescription !== null &&
            loaderData.project.idea === null &&
            loaderData.project.goals === null &&
            loaderData.project.implementation === null &&
            loaderData.project.targeting === null &&
            loaderData.project.hints === null && (
              <RichText html={loaderData.project.furtherDescription} />
            )}
          {loaderData.project.idea !== null && (
            <div className="mv-flex mv-flex-col mv-gap-4">
              <h3 className="mv-text-neutral-700 mv-text-lg mv-font-bold mv-mb-0">
                Idee
              </h3>
              <RichText
                additionalClassNames="mv-text-lg mv-mb-0"
                html={loaderData.project.idea}
              />
            </div>
          )}
          {loaderData.project.goals !== null && (
            <div className="mv-flex mv-flex-col mv-gap-4">
              <h3 className="mv-text-neutral-700 mv-text-lg mv-font-bold mv-mb-0">
                Ziele
              </h3>
              <RichText
                additionalClassNames="mv-text-lg mv-mb-0"
                html={loaderData.project.goals}
              />
            </div>
          )}
          {loaderData.project.implementation !== null && (
            <div className="mv-flex mv-flex-col mv-gap-4">
              <h3 className="mv-text-neutral-700 mv-text-lg mv-font-bold mv-mb-0">
                Durchführung
              </h3>
              <RichText
                additionalClassNames="mv-text-lg mv-mb-0"
                html={loaderData.project.implementation}
              />
            </div>
          )}
          {loaderData.project.targeting !== null && (
            <div className="mv-flex mv-flex-col mv-gap-4">
              <h3 className="mv-text-neutral-700 mv-text-lg mv-font-bold mv-mb-0">
                Wie wird die Zielgruppe erreicht?
              </h3>
              <RichText
                additionalClassNames="mv-text-lg mv-mb-0"
                html={loaderData.project.targeting}
              />
            </div>
          )}
          {loaderData.project.hints !== null && (
            <div className="mv-flex mv-flex-col mv-gap-4">
              <h3 className="mv-text-neutral-700 mv-text-lg mv-font-bold mv-mb-0">
                Tipps zum Nachmachen
              </h3>
              <RichText
                additionalClassNames="mv-text-lg mv-mb-0"
                html={loaderData.project.hints}
              />
            </div>
          )}
          {/* not only further description */}
          {loaderData.project.furtherDescription !== null &&
            (loaderData.project.idea !== null ||
              loaderData.project.goals !== null ||
              loaderData.project.implementation !== null ||
              loaderData.project.targeting !== null ||
              loaderData.project.hints !== null) && (
              <div className="mv-flex mv-flex-col mv-gap-4">
                <h3 className="mv-text-neutral-700 mv-text-lg mv-font-bold mv-mb-0">
                  Sonstiges
                </h3>
                <RichText
                  additionalClassNames="mv-text-lg"
                  html={loaderData.project.furtherDescription}
                />
              </div>
            )}
          {loaderData.project.video !== null && (
            <Video src={loaderData.project.video}>
              {loaderData.project.videoSubline !== null && (
                <Video.Subline>{loaderData.project.videoSubline}</Video.Subline>
              )}
            </Video>
          )}
        </>
      )}
    </>
  );
}

export default About;
