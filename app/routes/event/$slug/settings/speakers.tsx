import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useFetcher, useLoaderData, useParams } from "@remix-run/react";
import { Form } from "remix-forms";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { H3 } from "~/components/Heading/Heading";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { getEventBySlugOrThrow } from "../utils.server";
import type { ActionData as AddSpeakerActionData } from "./speakers/add-speaker";
import { addSpeakerSchema } from "./speakers/add-speaker";
import type { ActionData as RemoveSpeakerActionData } from "./speakers/remove-speaker";
import { removeSpeakerSchema } from "./speakers/remove-speaker";
import {
  checkOwnershipOrThrow,
  getSpeakerProfileDataFromEvent,
} from "./utils.server";

type LoaderData = {
  userId: string;
  eventId: string;
  speakers: ReturnType<typeof getSpeakerProfileDataFromEvent>;
};

export const loader: LoaderFunction = async (args) => {
  const { request, params } = args;
  const response = new Response();
  const authClient = createAuthClient(request, response);
  await checkFeatureAbilitiesOrThrow(authClient, "events");
  const slug = await getParamValueOrThrow(params, "slug");
  const sessionUser = await getSessionUserOrThrow(authClient);
  const event = await getEventBySlugOrThrow(slug);
  await checkOwnershipOrThrow(event, sessionUser);

  const speakers = getSpeakerProfileDataFromEvent(event);

  return json<LoaderData>(
    { userId: sessionUser.id, eventId: event.id, speakers },
    { headers: response.headers }
  );
};

function Speakers() {
  const { slug } = useParams();
  const loaderData = useLoaderData<LoaderData>();

  const addSpeakerFetcher = useFetcher<AddSpeakerActionData>();
  const removeSpeakerFetcher = useFetcher<RemoveSpeakerActionData>();

  return (
    <>
      <div className="mb-8">
        <h3>Vortragende</h3>
        <ul>
          {loaderData.speakers.map((profile) => {
            return (
              <div
                key={`team-member-${profile.id}`}
                className="w-full flex items-center flex-row border-b border-neutral-400 p-4"
              >
                <div className="pl-4">
                  <H3 like="h4" className="text-xl mb-1">
                    <Link
                      className="underline hover:no-underline"
                      to={`/profile/${profile.username}`}
                    >
                      {profile.firstName} {profile.lastName}
                    </Link>
                  </H3>
                </div>

                <Form
                  schema={removeSpeakerSchema}
                  fetcher={removeSpeakerFetcher}
                  action={`/event/${slug}/settings/speakers/remove-speaker`}
                  hiddenFields={["userId", "eventId", "speakerId"]}
                  values={{
                    userId: loaderData.userId,
                    eventId: loaderData.eventId,
                    speakerId: profile.id,
                  }}
                >
                  {(props) => {
                    const { Field, Button } = props;
                    return (
                      <>
                        <Field name="userId" />
                        <Field name="eventId" />
                        <Field name="speakerId" />
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
              </div>
            );
          })}
        </ul>
      </div>
      {removeSpeakerFetcher.data?.message && (
        <div className="p-4 bg-green-200 rounded-md mt-4">
          {removeSpeakerFetcher.data.message}
        </div>
      )}
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
