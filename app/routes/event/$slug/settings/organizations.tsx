import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useFetcher, useLoaderData, useParams } from "@remix-run/react";
import { GravityType } from "imgproxy/dist/types";
import { Form } from "remix-forms";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { H3 } from "~/components/Heading/Heading";
import { getImageURL } from "~/images.server";
import { getInitialsOfName } from "~/lib/string/getInitialsOfName";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { getPublicURL } from "~/storage.server";
import { getEventBySlugOrThrow } from "../utils.server";
import type { ActionData as AddOrganizationActionData } from "./organizations/add-organization";
import { addOrganizationSchema } from "./organizations/add-organization";
import type { ActionData as RemoveOrganizationActionData } from "./organizations/remove-organization";
import { removeOrganizationSchema } from "./organizations/remove-organization";
import {
  checkOwnershipOrThrow,
  getResponsibleOrganizationDataFromEvent,
} from "./utils.server";

type LoaderData = {
  userId: string;
  eventId: string;
  organizations: ReturnType<typeof getResponsibleOrganizationDataFromEvent>;
};

export const loader: LoaderFunction = async (args) => {
  const { request, params } = args;
  const response = new Response();
  const authClient = createAuthClient(request, response);
  await checkFeatureAbilitiesOrThrow(authClient, "events");
  const slug = getParamValueOrThrow(params, "slug");
  const sessionUser = await getSessionUserOrThrow(authClient);
  const event = await getEventBySlugOrThrow(slug);
  await checkOwnershipOrThrow(event, sessionUser);

  const organizations = getResponsibleOrganizationDataFromEvent(event);

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

  return json<LoaderData>(
    {
      userId: sessionUser.id,
      eventId: event.id,
      organizations: enhancedOrganizations,
    },
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
      <h1 className="mb-8">Verantwortliche Organisationen</h1>
      <p className="mb-8">
        Welche Organisation ist verantwortlich für Eure Veransatltung? Füge hier
        weitere Organisationen hinzu oder entferne sie.
      </p>
      <ul>
        {loaderData.organizations.map((organization) => {
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
                action={`/event/${slug}/settings/organizations/remove-organization`}
                hiddenFields={["userId", "eventId", "organizationId"]}
                values={{
                  userId: loaderData.userId,
                  eventId: loaderData.eventId,
                  organizationId: organization.id,
                }}
                className="ml-auto"
              >
                {(props) => {
                  const { Field, Button } = props;
                  return (
                    <>
                      <Field name="userId" />
                      <Field name="eventId" />
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
        action={`/event/${slug}/settings/organizations/add-organization`}
        hiddenFields={["eventId", "userId"]}
        values={{ eventId: loaderData.eventId, userId: loaderData.userId }}
        onTransition={({ reset, formState }) => {
          if (formState.isSubmitSuccessful) {
            reset();
          }
        }}
      >
        {({ Field, Errors, Button }) => {
          return (
            <>
              <Field name="eventId" />
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
      {addOrganizationFetcher.data?.message ? (
        <div className="p-4 bg-green-200 rounded-md mt-4">
          {addOrganizationFetcher.data.message}
        </div>
      ) : null}
    </>
  );
}

export default Organizations;
