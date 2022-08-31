import {
  Link,
  LoaderFunction,
  useFetcher,
  useLoaderData,
  useParams,
} from "remix";
import { Form } from "remix-forms";
import { getUserByRequestOrThrow } from "~/auth.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { getEventBySlugOrThrow } from "../utils.server";
import { addOrganizationSchema } from "./organizations/add-organization";
import {
  checkOwnershipOrThrow,
  getResponsibleOrganizationDataFromEvent,
} from "./utils.server";

type LoaderData = {
  userId: string;
  eventId: string;
  organizations: ReturnType<typeof getResponsibleOrganizationDataFromEvent>;
};

export const loader: LoaderFunction = async (args): Promise<LoaderData> => {
  const { request, params } = args;
  await checkFeatureAbilitiesOrThrow(request, "events");
  const slug = getParamValueOrThrow(params, "slug");
  const currentUser = await getUserByRequestOrThrow(request);
  const event = await getEventBySlugOrThrow(slug);
  await checkOwnershipOrThrow(event, currentUser);

  const organizations = getResponsibleOrganizationDataFromEvent(event);
  return { userId: currentUser.id, eventId: event.id, organizations };
};

function Organizations() {
  const { slug } = useParams();
  const loaderData = useLoaderData<LoaderData>();
  const addOrganizationFetcher = useFetcher();

  return (
    <>
      <div className="mb-8">
        <h1>Verantwortliche Organisationen</h1>
        <ul>
          {loaderData.organizations.map((item) => {
            return (
              <li key={item.id}>
                <Link
                  className="underline hover:no-underline"
                  to={`/organization/${item.slug}`}
                >
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      <h4 className="mb-4 font-semibold">Teammitglied hinzufügen</h4>
      <p className="mb-8">
        Füge hier Deiner Veranstaltung ein bereits bestehendes Profil hinzu.
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
      {addOrganizationFetcher.data?.message && (
        <div className="p-4 bg-green-200 rounded-md mt-4">
          {addOrganizationFetcher.data.message}
        </div>
      )}
    </>
  );
}

export default Organizations;
