import { Chip } from "@mint-vernetzt/components";
import { useLoaderData } from "@remix-run/react";
import { json, type LoaderFunctionArgs } from "@remix-run/server-runtime";
import { RichText } from "~/components/Richtext/RichText";
import { invariantResponse } from "~/lib/utils/response";
import { prismaClient } from "~/prisma.server";
import { useTranslation } from "react-i18next";
import { detectLanguage } from "~/root.server";
import i18next from "~/i18next.server";

const i18nNS = ["routes/project/detail/requirements", "datasets/financings"];

export const handle = {
  i18n: i18nNS,
};

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;

  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, i18nNS);

  // check slug exists (throw bad request if not)
  invariantResponse(
    params.slug !== undefined,
    t("error.invariant.invalidRoute"),
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

  invariantResponse(project !== null, t("error.invariant.notFound"), {
    status: 404,
  });

  return json({ project });
};

function Requirements() {
  const loaderData = useLoaderData<typeof loader>();
  const { project } = loaderData;
  const { t } = useTranslation(i18nNS);

  return (
    <>
      <p className="mv-font-normal mv-text-neutral-800">
        {t("content.information")}
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
            {t("content.confirmation")}
          </p>
        )}
      {project.timeframe !== null && (
        <>
          <h2 className="mv-text-2xl @md:mv-text-5xl mv-font-bold mv-text-primary mv-mb-0">
            {t("content.timeFrame.headline")}
          </h2>
          <h3 className="mv-text-neutral-700 mv-text-lg mv-font-bold mv-mb-0">
            {t("content.timeFrame.intro")}
          </h3>
          <RichText html={project.timeframe} />
        </>
      )}
      {(project.jobFillings !== null ||
        project.furtherJobFillings !== null) && (
        <>
          <h2 className="mv-text-2xl @md:mv-text-5xl mv-font-bold mv-text-primary mv-mb-0">
            {t("content.jobFillings.headline")}
          </h2>
          {project.jobFillings !== null && (
            <>
              <h3 className="mv-text-neutral-700 mv-text-lg mv-font-bold mv-mb-0">
                {t("content.jobFillings.intro")}
              </h3>
              <RichText html={project.jobFillings} />
            </>
          )}
          {project.furtherJobFillings !== null && (
            <>
              <h3 className="mv-text-neutral-700 mv-text-lg mv-font-bold mv-mb-0">
                {t("content.furtherJobFillings.headline")}
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
          <h2 className="mv-text-2xl @md:mv-text-5xl mv-font-bold mv-text-primary mv-mb-0">
            {t("content.finance.headline")}
          </h2>
          {project.yearlyBudget !== null && (
            <>
              <h3 className="mv-text-neutral-700 mv-text-lg mv-font-bold mv-mb-0">
                {t("content.finance.yearlyBudget")}
              </h3>
              <p className="mv-font-normal mv-text-neutral-800">
                {project.yearlyBudget}
              </p>
            </>
          )}
          {project.financings.length > 0 && (
            <div className="mv-flex mv-flex-col mv-gap-4">
              <h3 className="mv-text-neutral-700 mv-text-lg mv-font-bold mv-mb-0">
                {t("content.finance.financings")}
              </h3>
              <Chip.Container>
                {project.financings.map((relation) => {
                  return (
                    <Chip key={relation.financing.slug} color="primary">
                      {t(`${relation.financing.slug}.title`, {
                        ns: "datasets/financings",
                      })}
                    </Chip>
                  );
                })}
              </Chip.Container>
            </div>
          )}
          {project.furtherFinancings !== null && (
            <>
              <h3 className="mv-text-neutral-700 mv-text-lg mv-font-bold mv-mb-0">
                {t("content.finance.moreInformation")}
              </h3>
              <RichText html={project.furtherFinancings} />
            </>
          )}
        </>
      )}
      {(project.technicalRequirements !== null ||
        project.furtherTechnicalRequirements !== null) && (
        <>
          <h2 className="mv-text-2xl @md:mv-text-5xl mv-font-bold mv-text-primary mv-mb-0">
            {t("content.technical.headline")}
          </h2>
          {project.technicalRequirements !== null && (
            <>
              <h3 className="mv-text-neutral-700 mv-text-lg mv-font-bold mv-mb-0">
                {t("content.technical.technicalRequirements")}
              </h3>
              <RichText html={project.technicalRequirements} />
            </>
          )}
          {project.furtherTechnicalRequirements !== null && (
            <>
              <h3 className="mv-text-neutral-700 mv-text-lg mv-font-bold mv-mb-0">
                {t("content.technical.furtherTechnicalRequirements")}
              </h3>
              <RichText html={project.furtherTechnicalRequirements} />
            </>
          )}
        </>
      )}
      {(project.roomSituation !== null ||
        project.furtherRoomSituation !== null) && (
        <>
          <h2 className="mv-text-2xl @md:mv-text-5xl mv-font-bold mv-text-primary mv-mb-0">
            {t("content.rooms.headline")}
          </h2>
          {project.roomSituation !== null && (
            <>
              <h3 className="mv-text-neutral-700 mv-text-lg mv-font-bold mv-mb-0">
                {t("content.rooms.roomSituation")}
              </h3>
              <RichText html={project.roomSituation} />
            </>
          )}
          {project.furtherRoomSituation !== null && (
            <>
              <h3 className="mv-text-neutral-700 mv-text-lg mv-font-bold mv-mb-0">
                {t("content.rooms.furtherRoomSituation")}
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
