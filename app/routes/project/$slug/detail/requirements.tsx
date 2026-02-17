import { Chip } from "@mint-vernetzt/components/src/molecules/Chip";
import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { RichText } from "~/components/legacy/Richtext/RichText";
import { invariantResponse } from "~/lib/utils/response";
import { prismaClient } from "~/prisma.server";
import { detectLanguage } from "~/i18n.server";
import { languageModuleMap } from "~/locales/.server";
import { hasContent } from "~/utils.shared";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["project/$slug/detail/requirements"];

  // check slug exists (throw bad request if not)
  invariantResponse(
    params.slug !== undefined,
    locales.route.error.invariant.invalidRoute,
    {
      status: 400,
    }
  );

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
              slug: true,
            },
          },
        },
      },
    },
  });

  invariantResponse(project !== null, locales.route.error.invariant.notFound, {
    status: 404,
  });

  return { project, locales };
};

function Requirements() {
  const loaderData = useLoaderData<typeof loader>();
  const { project, locales } = loaderData;

  return (
    <>
      <p className="font-normal text-neutral-800">
        {locales.route.content.information}
      </p>

      {hasContent(project.timeframe) === false &&
        hasContent(project.jobFillings) === false &&
        hasContent(project.furtherJobFillings) === false &&
        hasContent(project.yearlyBudget) === false &&
        hasContent(project.financings) === false &&
        hasContent(project.furtherFinancings) === false &&
        hasContent(project.technicalRequirements) === false &&
        hasContent(project.furtherTechnicalRequirements) === false &&
        hasContent(project.roomSituation) === false &&
        hasContent(project.furtherRoomSituation) === false && (
          <p className="font-normal text-neutral-800">
            {locales.route.content.confirmation}
          </p>
        )}
      {hasContent(project.timeframe) && (
        <>
          <h2 className="text-2xl @md:text-5xl font-bold text-primary mb-0">
            {locales.route.content.timeFrame.headline}
          </h2>
          <h3 className="text-neutral-700 text-lg font-bold mb-0">
            {locales.route.content.timeFrame.intro}
          </h3>
          <RichText html={project.timeframe} />
        </>
      )}
      {(hasContent(project.jobFillings) ||
        hasContent(project.furtherJobFillings)) &&
        project.furtherJobFillings !== null && (
          <>
            <h2 className="text-2xl @md:text-5xl font-bold text-primary mb-0">
              {locales.route.content.jobFillings.headline}
            </h2>
            {project.jobFillings !== null && (
              <>
                <h3 className="text-neutral-700 text-lg font-bold mb-0">
                  {locales.route.content.jobFillings.intro}
                </h3>
                <RichText html={project.jobFillings} />
              </>
            )}
            {project.furtherJobFillings !== null && (
              <>
                <h3 className="text-neutral-700 text-lg font-bold mb-0">
                  {locales.route.content.furtherJobFillings.headline}
                </h3>
                <RichText html={project.furtherJobFillings} />
              </>
            )}
          </>
        )}
      {(hasContent(project.yearlyBudget) ||
        hasContent(project.financings) ||
        hasContent(project.furtherFinancings)) && (
        <>
          <h2 className="text-2xl @md:text-5xl font-bold text-primary mb-0">
            {locales.route.content.finance.headline}
          </h2>
          {hasContent(project.yearlyBudget) && (
            <>
              <h3 className="text-neutral-700 text-lg font-bold mb-0">
                {locales.route.content.finance.yearlyBudget}
              </h3>
              <p className="font-normal text-neutral-800">
                {project.yearlyBudget}
              </p>
            </>
          )}
          {hasContent(project.financings) && (
            <div className="flex flex-col gap-4">
              <h3 className="text-neutral-700 text-lg font-bold mb-0">
                {locales.route.content.finance.financings}
              </h3>
              <Chip.Container>
                {project.financings.map((relation) => {
                  let title;
                  if (relation.financing.slug in locales.financings) {
                    type LocaleKey = keyof typeof locales.financings;
                    title =
                      locales.financings[relation.financing.slug as LocaleKey]
                        .title;
                  } else {
                    console.error(
                      `Focus ${relation.financing.slug} not found in locales`
                    );
                    title = relation.financing.slug;
                  }
                  return (
                    <Chip key={relation.financing.slug} color="primary">
                      {title}
                    </Chip>
                  );
                })}
              </Chip.Container>
            </div>
          )}
          {hasContent(project.furtherFinancings) && (
            <>
              <h3 className="text-neutral-700 text-lg font-bold mb-0">
                {locales.route.content.finance.moreInformation}
              </h3>
              <RichText html={project.furtherFinancings} />
            </>
          )}
        </>
      )}
      {(hasContent(project.technicalRequirements) ||
        hasContent(project.furtherTechnicalRequirements)) && (
        <>
          <h2 className="text-2xl @md:text-5xl font-bold text-primary mb-0">
            {locales.route.content.technical.headline}
          </h2>
          {hasContent(project.technicalRequirements) && (
            <>
              <h3 className="text-neutral-700 text-lg font-bold mb-0">
                {locales.route.content.technical.technicalRequirements}
              </h3>
              <RichText html={project.technicalRequirements} />
            </>
          )}
          {hasContent(project.furtherTechnicalRequirements) && (
            <>
              <h3 className="text-neutral-700 text-lg font-bold mb-0">
                {locales.route.content.technical.furtherTechnicalRequirements}
              </h3>
              <RichText html={project.furtherTechnicalRequirements} />
            </>
          )}
        </>
      )}
      {(hasContent(project.roomSituation) ||
        hasContent(project.furtherRoomSituation)) && (
        <>
          <h2 className="text-2xl @md:text-5xl font-bold text-primary mb-0">
            {locales.route.content.rooms.headline}
          </h2>
          {hasContent(project.roomSituation) && (
            <>
              <h3 className="text-neutral-700 text-lg font-bold mb-0">
                {locales.route.content.rooms.roomSituation}
              </h3>
              <RichText html={project.roomSituation} />
            </>
          )}
          {hasContent(project.furtherRoomSituation) && (
            <>
              <h3 className="text-neutral-700 text-lg font-bold mb-0">
                {locales.route.content.rooms.furtherRoomSituation}
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
