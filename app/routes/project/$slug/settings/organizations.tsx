import { json } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";
import { Link, useFetcher, useLoaderData, useParams } from "@remix-run/react";
import { createServerClient } from "@supabase/auth-helpers-remix";
import { Form } from "remix-forms";
import { getSessionUserOrThrow } from "~/auth.server";
import { H3 } from "~/components/Heading/Heading";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { getProjectBySlugOrThrow } from "../utils.server";
import { addOrganizationSchema } from "./organizations/add-organization";
import { removeOrganizationSchema } from "./organizations/remove-organization";
import type { ActionData as AddOrganizationActionData } from "./organizations/add-organization";
import type { ActionData as RemoveOrganizationActionData } from "./organizations/remove-organization";
import {
  checkOwnershipOrThrow,
  getResponsibleOrganizationDataFromProject,
} from "./utils.server";

type LoaderData = {
  userId: string;
  projectId: string;
  organizations: ReturnType<typeof getResponsibleOrganizationDataFromProject>;
};

export const loader: LoaderFunction = async (args) => {
  const { request, params } = args;
  const response = new Response();

  const supabaseClient = createServerClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      request,
      response,
    }
  );
  const slug = getParamValueOrThrow(params, "slug");
  const sessionUser = await getSessionUserOrThrow(supabaseClient);

  const project = await getProjectBySlugOrThrow(slug);

  await checkOwnershipOrThrow(project, sessionUser);

  const organizations = getResponsibleOrganizationDataFromProject(project);
  return json<LoaderData>(
    { userId: sessionUser.id, projectId: project.id, organizations },
    { headers: response.headers }
  );
};

function Organizations() {
  const { slug } = useParams();
  const loaderData = useLoaderData<LoaderData>();
  const addOrganizationFetcher = useFetcher<AddOrganizationActionData>();
  const removeOrganizationFetcher = useFetcher<RemoveOrganizationActionData>();

  return (
    <>
      <div className="mb-8">
        <h1>Verantwortliche Organisationen</h1>
        <ul>
          {loaderData.organizations.map((item) => {
            return (
              <li
                className="w-full flex items-center flex-row border-b border-neutral-400 p-4"
                key={item.id}
              >
                <div className="pl-4">
                  <H3 like="h4" className="text-xl mb-1">
                    <Link
                      className="underline hover:no-underline"
                      to={`/organization/${item.slug}`}
                    >
                      {item.name}
                    </Link>
                  </H3>
                </div>
                <Form
                  schema={removeOrganizationSchema}
                  fetcher={removeOrganizationFetcher}
                  action={`/project/${slug}/settings/organizations/remove-organization`}
                  hiddenFields={["userId", "projectId", "organizationId"]}
                  values={{
                    userId: loaderData.userId,
                    projectId: loaderData.projectId,
                    organizationId: item.id,
                  }}
                >
                  {(props) => {
                    const { Field, Button } = props;
                    return (
                      <>
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
      </div>
      <h4 className="mb-4 font-semibold">Organisation hinzufügen</h4>
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
        onTransition={({ reset, formState }) => {
          if (formState.isSubmitSuccessful) {
            reset();
          }
        }}
      >
        {({ Field, Errors, Button }) => {
          return (
            <>
              <Field name="projectId" />
              <Field name="userId" />
              <div className="form-control w-full">
                <div className="flex flex-row items-center mb-2">
                  <div className="flex-auto">
                    <label
                      id="label-for-email"
                      htmlFor="Email"
                      className="label"
                    >
                      Name der Organisation
                    </label>
                  </div>
                </div>

                <div className="flex flex-row">
                  <Field name="organizationName" className="flex-auto">
                    {({ Errors }) => (
                      <>
                        <input
                          id="organizationName"
                          name="organizationName"
                          className="input input-bordered w-full"
                        />
                        <Errors />
                      </>
                    )}
                  </Field>
                  <div className="ml-2">
                    <Button className="btn btn-outline-primary ml-auto btn-small">
                      Hinzufügen
                    </Button>
                    <Errors />
                  </div>
                </div>
              </div>
            </>
          );
        }}
      </Form>
    </>
  );
}

export default Organizations;
