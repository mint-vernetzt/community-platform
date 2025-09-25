import { type LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { detectLanguage } from "~/i18n.server";
import { ListContainer } from "~/components-next/ListContainer";
import { ListItem } from "~/components-next/ListItem";
import { Container } from "~/components-next/MyEventsOrganizationDetailContainer";
import { deriveOrganizationMode } from "~/routes/organization/$slug/utils.server";
import {
  addImgUrls,
  filterOrganization,
  getOrganization,
} from "./projects.server";
import { languageModuleMap } from "~/locales/.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;

  const { authClient } = createAuthClient(request);
  const slug = getParamValueOrThrow(params, "slug");
  const sessionUser = await getSessionUser(authClient);
  const mode = await deriveOrganizationMode(sessionUser, slug);
  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["organization/$slug/detail/projects"];

  const organization = await getOrganization(slug);
  invariantResponse(
    organization !== null,
    locales.route.server.error.organizationNotFound,
    {
      status: 404,
    }
  );

  let filteredOrganization;
  if (mode === "anon") {
    filteredOrganization = filterOrganization(organization);
  } else {
    filteredOrganization = organization;
  }

  const enhancedOrganization = addImgUrls(authClient, filteredOrganization);

  return {
    organization: enhancedOrganization,
    locales,
  };
};

function Projects() {
  const loaderData = useLoaderData<typeof loader>();
  const { organization, locales } = loaderData;

  return (
    <Container.Section className="-mt-4 @md:-mt-6 @lg:-mt-8 pt-10 @sm:py-8 @sm:px-4 @lg:px-6 flex flex-col gap-10 @sm:border-b @sm:border-x @sm:border-neutral-200 bg-white @sm:rounded-b-2xl">
      {organization.responsibleForProject.length > 0 ? (
        <div className="flex flex-col gap-4">
          <h2 className="mb-0 text-neutral-700 text-xl font-bold leading-6">
            {locales.route.headlines.responsibleForProject}
          </h2>
          <ListContainer listKey="responsible-for-project" locales={locales}>
            {organization.responsibleForProject.map((relation, index) => {
              return (
                <ListItem
                  key={`responsible-for-project-${relation.project.slug}`}
                  listIndex={index}
                  entity={relation.project}
                  locales={locales}
                  prefetch="intent"
                />
              );
            })}
          </ListContainer>
        </div>
      ) : null}
    </Container.Section>
  );
}

export default Projects;
