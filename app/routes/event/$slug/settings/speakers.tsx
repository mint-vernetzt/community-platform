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
import { Form, Form as RemixForm } from "remix-forms";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import Autocomplete from "~/components/Autocomplete/Autocomplete";
import { H3 } from "~/components/Heading/Heading";
import { getImageURL } from "~/images.server";
import { getInitials } from "~/lib/profile/getInitials";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { getProfileSuggestionsForAutocomplete } from "~/routes/utils.server";
import { getPublicURL } from "~/storage.server";
import { publishSchema, type action as publishAction } from "./events/publish";
import {
  getEventBySlug,
  getSpeakerProfileDataFromEvent,
} from "./speakers.server";
import {
  addSpeakerSchema,
  type action as addSpeakerAction,
} from "./speakers/add-speaker";
import {
  removeSpeakerSchema,
  type action as removeSpeakerAction,
} from "./speakers/remove-speaker";
import { checkOwnershipOrThrow } from "./utils.server";

export const loader = async (args: LoaderArgs) => {
  const { request, params } = args;
  const response = new Response();
  const authClient = createAuthClient(request, response);
  await checkFeatureAbilitiesOrThrow(authClient, "events");
  const slug = await getParamValueOrThrow(params, "slug");
  const sessionUser = await getSessionUserOrThrow(authClient);
  const event = await getEventBySlug(slug);
  invariantResponse(event, "Event not found", { status: 404 });
  await checkOwnershipOrThrow(event, sessionUser);

  const speakers = getSpeakerProfileDataFromEvent(event);
  const enhancedSpeakers = speakers.map((speaker) => {
    if (speaker.avatar !== null) {
      const publicURL = getPublicURL(authClient, speaker.avatar);
      if (publicURL !== null) {
        speaker.avatar = getImageURL(publicURL, {
          resize: { type: "fill", width: 64, height: 64 },
          gravity: GravityType.center,
        });
      }
    }
    return speaker;
  });

  const url = new URL(request.url);
  const suggestionsQuery =
    url.searchParams.get("autocomplete_query") || undefined;
  let speakerSuggestions;
  if (suggestionsQuery !== undefined && suggestionsQuery !== "") {
    const query = suggestionsQuery.split(" ");
    const alreadySpeakerIds = speakers.map((speaker) => {
      return speaker.id;
    });
    speakerSuggestions = await getProfileSuggestionsForAutocomplete(
      authClient,
      alreadySpeakerIds,
      query
    );
  }

  return json(
    {
      userId: sessionUser.id,
      eventId: event.id,
      published: event.published,
      speakers: enhancedSpeakers,
      speakerSuggestions,
    },
    { headers: response.headers }
  );
};

function Speakers() {
  const { slug } = useParams();
  const loaderData = useLoaderData<typeof loader>();

  const addSpeakerFetcher = useFetcher<typeof addSpeakerAction>();
  const removeSpeakerFetcher = useFetcher<typeof removeSpeakerAction>();
  const publishFetcher = useFetcher<typeof publishAction>();
  const [searchParams] = useSearchParams();
  const suggestionsQuery = searchParams.get("autocomplete_query");
  const submit = useSubmit();

  return (
    <>
      <h1 className="mb-8">Vortragende</h1>
      <p className="mb-8">
        Wer ist Speaker:in bei Eurer Veranstaltung? Füge hier weitere
        Speaker:innen hinzu oder entferne sie.
      </p>
      <h4 className="mb-4 mt-4 font-semibold">Vortragende hinzufügen</h4>
      <p className="mb-8">
        Füge hier Deiner Veranstaltung ein bereits bestehendes Profil hinzu.
      </p>
      <Form
        schema={addSpeakerSchema}
        fetcher={addSpeakerFetcher}
        action={`/event/${slug}/settings/speakers/add-speaker`}
        hiddenFields={["eventId", "userId"]}
        values={{ eventId: loaderData.eventId, userId: loaderData.userId }}
        onSubmit={() => {
          submit({
            method: "get",
            action: `/event/${slug}/settings/speakers`,
          });
        }}
      >
        {({ Field, Errors, Button, register }) => {
          return (
            <>
              <Errors />
              <Field name="eventId" />
              <Field name="userId" />
              <div className="form-control w-full">
                <div className="flex flex-row items-center mb-2">
                  <div className="flex-auto">
                    <label id="label-for-name" htmlFor="Name" className="label">
                      Name oder Email der Speaker:in
                    </label>
                  </div>
                </div>

                <div className="flex flex-row">
                  <Field name="id" className="flex-auto">
                    {({ Errors }) => (
                      <>
                        <Errors />
                        <Autocomplete
                          suggestions={loaderData.speakerSuggestions || []}
                          suggestionsLoaderPath={`/event/${slug}/settings/speakers`}
                          defaultValue={suggestionsQuery || ""}
                          {...register("id")}
                          searchParameter="autocomplete_query"
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
      {addSpeakerFetcher.data !== undefined &&
      "message" in addSpeakerFetcher.data ? (
        <div className={`p-4 bg-green-200 rounded-md mt-4`}>
          {addSpeakerFetcher.data.message}
        </div>
      ) : null}
      <h4 className="mb-4 mt-16 font-semibold">Aktuelle Speaker:innen</h4>
      <p className="mb-8">
        Hier siehst du alle Speaker:innen der Veranstaltung auf einen Blick.{" "}
      </p>
      <div className="mb-4 md:max-h-[630px] overflow-auto">
        {loaderData.speakers.map((profile) => {
          const initials = getInitials(profile);
          return (
            <div
              key={`team-member-${profile.id}`}
              className="w-full flex items-center flex-row flex-nowrap border-b border-neutral-400 py-4 md:px-4"
            >
              <div className="h-16 w-16 bg-primary text-white text-3xl flex items-center justify-center rounded-full border overflow-hidden shrink-0">
                {profile.avatar !== null && profile.avatar !== "" ? (
                  <img src={profile.avatar} alt={initials} />
                ) : (
                  <>{initials}</>
                )}
              </div>
              <div className="pl-4">
                <Link to={`/profile/${profile.username}`}>
                  <H3
                    like="h4"
                    className="text-xl mb-1 no-underline hover:underline"
                  >
                    {profile.firstName} {profile.lastName}
                  </H3>
                </Link>
                {profile.position ? (
                  <p className="font-bold text-sm cursor-default">
                    {profile.position}
                  </p>
                ) : null}
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
                className="ml-auto"
              >
                {(props) => {
                  const { Field, Button, Errors } = props;
                  return (
                    <>
                      <Errors />
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
      </div>
      <footer className="fixed bg-white border-t-2 border-primary w-full inset-x-0 bottom-0 pb-24 md:pb-0">
        <div className="container">
          <div className="flex flex-row flex-nowrap items-center justify-end my-4">
            <RemixForm
              schema={publishSchema}
              fetcher={publishFetcher}
              action={`/event/${slug}/settings/events/publish`}
              hiddenFields={["eventId", "userId", "publish"]}
              values={{
                eventId: loaderData.eventId,
                userId: loaderData.userId,
                publish: !loaderData.published,
              }}
            >
              {(props) => {
                const { Button, Field } = props;
                return (
                  <>
                    <Field name="userId" />
                    <Field name="eventId" />
                    <Field name="publish"></Field>
                    <Button className="btn btn-outline-primary">
                      {loaderData.published ? "Verstecken" : "Veröffentlichen"}
                    </Button>
                  </>
                );
              }}
            </RemixForm>
          </div>
        </div>
      </footer>
    </>
  );
}

export default Speakers;
