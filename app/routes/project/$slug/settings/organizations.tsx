import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Link,
  useFetcher,
  useLoaderData,
  useParams,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import { GravityType } from "imgproxy/dist/types";
import { Form } from "remix-forms";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import Autocomplete from "~/components/Autocomplete/Autocomplete";
import { H3 } from "~/components/Heading/Heading";
import { getImageURL } from "~/images.server";
import { getInitialsOfName } from "~/lib/string/getInitialsOfName";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { getPublicURL } from "~/storage.server";
import { getProjectBySlugOrThrow } from "../utils.server";
import type {
  FailureActionData,
  SuccessActionData,
} from "./organizations/add-organization";
import { addOrganizationSchema } from "./organizations/add-organization";
import type { ActionData as RemoveOrganizationActionData } from "./organizations/remove-organization";
import { removeOrganizationSchema } from "./organizations/remove-organization";
import {
  checkOwnershipOrThrow,
  getResponsibleOrganizationDataFromProject,
  getResponsibleOrganizationSuggestions,
} from "./utils.server";

export const loader = async (args: LoaderArgs) => {
  const { request, params } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);
  const slug = getParamValueOrThrow(params, "slug");
  const sessionUser = await getSessionUserOrThrow(authClient);

  const project = await getProjectBySlugOrThrow(slug);

  await checkOwnershipOrThrow(project, sessionUser);

  const organizations = getResponsibleOrganizationDataFromProject(project);
  const enhancedOrganizations = organizations.map((organization) => {
    if (organization.logo !== null) {
      const publicURL = getPublicURL(authClient, organization.logo);
      if (publicURL !== null) {
        organization.logo = getImageURL(publicURL, {
          resize: { type: "fill", width: 64, height: 64 },
          gravity: GravityType.center,
        });
      }
    }
    return organization;
  });

  const url = new URL(request.url);
  const suggestionsQuery =
    url.searchParams.get("autocomplete_query") || undefined;
  let responsibleOrganizationSuggestions;
  if (suggestionsQuery !== undefined && suggestionsQuery !== "") {
    const query = suggestionsQuery.split(" ");
    const alreadyResponsibleOrganizationSlugs = organizations.map(
      (organization) => {
        return organization.slug;
      }
    );
    responsibleOrganizationSuggestions =
      await getResponsibleOrganizationSuggestions(
        authClient,
        alreadyResponsibleOrganizationSlugs,
        query
      );
  }

  return json(
    {
      userId: sessionUser.id,
      projectId: project.id,
      responsibleOrganizations: enhancedOrganizations,
      responsibleOrganizationSuggestions,
    },
    { headers: response.headers }
  );
};

function Organizations() {
  const { slug } = useParams();
  const loaderData = useLoaderData<typeof loader>();
  const addOrganizationFetcher = useFetcher<
    SuccessActionData | FailureActionData
  >();
  const removeOrganizationFetcher = useFetcher<RemoveOrganizationActionData>();
  const [searchParams] = useSearchParams();
  const suggestionsQuery = searchParams.get("autocomplete_query");
  const submit = useSubmit();

  return (
    <>
      <h1 className="mb-8">Verantwortliche Organisationen</h1>
      <p className="mb-8">
        Welche Organisation ist verantwortlich für Euer Projekt? Füge hier
        weitere Organisationen hinzu oder entferne sie.
      </p>
      <ul>
        {loaderData.responsibleOrganizations.map((organization) => {
          const initials = getInitialsOfName(organization.name);
          return (
            <li
              className="w-full flex items-center flex-row border-b border-neutral-400 p-4"
              key={organization.id}
            >
              <div className="h-16 w-16 bg-primary text-white text-3xl flex items-center justify-center rounded-full border overflow-hidden">
                {organization.logo !== null && organization.logo !== "" ? (
                  <img src={organization.logo} alt={organization.name} />
                ) : (
                  <>{initials}</>
                )}
              </div>
              <div className="pl-4">
                <Link to={`/organization/${organization.slug}`}>
                  <H3
                    like="h4"
                    className="text-xl mb-1 no-underline hover:underline"
                  >
                    {organization.name}
                  </H3>
                </Link>
                {organization.types.length !== 0 ? (
                  <p className="font-bold text-sm cursor-default">
                    {organization.types
                      .map(({ organizationType }) => {
                        return organizationType.title;
                      })
                      .join(" / ")}
                  </p>
                ) : null}
              </div>
              <Form
                schema={removeOrganizationSchema}
                fetcher={removeOrganizationFetcher}
                action={`/project/${slug}/settings/organizations/remove-organization`}
                hiddenFields={["userId", "projectId", "organizationId"]}
                values={{
                  userId: loaderData.userId,
                  projectId: loaderData.projectId,
                  organizationId: organization.id,
                }}
                className="ml-auto"
              >
                {(props) => {
                  const { Field, Button, Errors } = props;
                  return (
                    <>
                      <Errors />
                      <Field name="userId" />
                      <Field name="projectId" />
                      <Field name="organizationId" />
                      <Button className="ml-auto btn-none" title="entfernen">
                        <svg
                          viewBox="0 0 10 10"
                          width="10px"
                          height="10px"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M.808.808a.625.625 0 0 1 .885 0L5 4.116 8.308.808a.626.626 0 0 1 .885.885L5.883 5l3.31 3.308a.626.626 0 1 1-.885.885L5 5.883l-3.307 3.31a.626.626 0 1 1-.885-.885L4.116 5 .808 1.693a.625.625 0 0 1 0-.885Z"
                            fill="currentColor"
                          />
                        </svg>
                      </Button>
                    </>
                  );
                }}
              </Form>
            </li>
          );
        })}
      </ul>
      <h4 className="mb-4 mt-4 font-semibold">Organisation hinzufügen</h4>
      <p className="mb-8">
        Füge hier Deiner Veranstaltung eine bereits bestehende Organisation
        hinzu.
      </p>
      <Form
        schema={addOrganizationSchema}
        fetcher={addOrganizationFetcher}
        action={`/project/${slug}/settings/organizations/add-organization`}
        hiddenFields={["projectId", "userId"]}
        values={{ projectId: loaderData.projectId, userId: loaderData.userId }}
        onSubmit={() => {
          submit({
            method: "get",
            action: `/organization/${slug}/settings/network`,
          });
        }}
      >
        {({ Field, Errors, Button, register }) => {
          return (
            <>
              <Errors />
              <Field name="projectId" />
              <Field name="userId" />
              <div className="form-control w-full">
                <div className="flex flex-row items-center mb-2">
                  <div className="flex-auto">
                    <label id="label-for-name" htmlFor="Name" className="label">
                      Name der Organisation
                    </label>
                  </div>
                </div>

                <div className="flex flex-row">
                  <Field name="id" className="flex-auto">
                    {({ Errors }) => (
                      <>
                        <Errors />
                        <Autocomplete
                          suggestions={
                            loaderData.responsibleOrganizationSuggestions || []
                          }
                          suggestionsLoaderPath={`/project/${slug}/settings/organizations`}
                          value={suggestionsQuery || ""}
                          {...register("id")}
                        />
                      </>
                    )}
                  </Field>
                  <div className="ml-2">
                    <Button className="bg-transparent w-10 h-8 flex items-center justify-center rounded-md border border-neutral-500 text-neutral-600 mt-0.5">
                      +
                    </Button>
                  </div>
                </div>
              </div>
            </>
          );
        }}
      </Form>
      {addOrganizationFetcher.data !== undefined &&
      "message" in addOrganizationFetcher.data ? (
        <div className={`p-4 bg-green-200 rounded-md mt-4`}>
          {addOrganizationFetcher.data.message}
        </div>
      ) : null}
    </>
  );
}

export default Organizations;
