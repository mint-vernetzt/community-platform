import { LoaderFunction, useFetcher, useLoaderData, useParams } from "remix";
import { Form } from "remix-forms";
import { getUserByRequestOrThrow } from "~/auth.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { getEventBySlugOrThrow } from "../utils.server";
import { addSpeakerSchema } from "./speakers/add-speaker";
import {
  checkOwnershipOrThrow,
  getSpeakerProfileDataFromEvent,
} from "./utils.server";

type LoaderData = {
  userId: string;
  eventId: string;
  speakers: ReturnType<typeof getSpeakerProfileDataFromEvent>;
};

export const loader: LoaderFunction = async (args): Promise<LoaderData> => {
  const { request, params } = args;
  await checkFeatureAbilitiesOrThrow(request, "events");
  const slug = await getParamValueOrThrow(params, "slug");
  const currentUser = await getUserByRequestOrThrow(request);
  const event = await getEventBySlugOrThrow(slug);
  await checkOwnershipOrThrow(event, currentUser);

  const speakers = getSpeakerProfileDataFromEvent(event);

  return { userId: currentUser.id, eventId: event.id, speakers };
};

function Speakers() {
  const { slug } = useParams();
  const loaderData = useLoaderData<LoaderData>();

  const addSpeakerFetcher = useFetcher();

  return (
    <>
      <div className="mb-8">
        <h3>Vortragende</h3>
      </div>
      <h4 className="mb-4 font-semibold">Vortragende hinzufügen</h4>
      <p className="mb-8">
        Füge hier Deiner Veranstaltung ein bereits bestehendes Profil hinzu.
      </p>
      <Form
        schema={addSpeakerSchema}
        fetcher={addSpeakerFetcher}
        action={`/event/${slug}/settings/speakers/add-speaker`}
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
                      E-Mail
                    </label>
                  </div>
                </div>

                <div className="flex flex-row">
                  <Field name="email" className="flex-auto">
                    {({ Errors }) => (
                      <>
                        <input
                          id="email"
                          name="email"
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
      {addSpeakerFetcher.data?.message && (
        <div className="p-4 bg-green-200 rounded-md mt-4">
          {addSpeakerFetcher.data.message}
        </div>
      )}
    </>
  );
}

export default Speakers;
