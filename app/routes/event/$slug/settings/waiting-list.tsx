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
import { getInitials } from "~/lib/profile/getInitials";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { getPublicURL } from "~/storage.server";
import { getEventBySlugOrThrow, getFullDepthProfiles } from "../utils.server";
import {
  checkOwnershipOrThrow,
  getParticipantsDataFromEvent,
  getWaitingParticipantSuggestions,
} from "./utils.server";
import type {
  FailureActionData,
  SuccessActionData,
} from "./waiting-list/add-to-waiting-list";
import { addToWaitingListSchema } from "./waiting-list/add-to-waiting-list";
import { type ActionData as MoveToParticipantsActionData } from "./waiting-list/move-to-participants";
import { moveToParticipantsSchema } from "./waiting-list/move-to-participants";
import type { ActionData as RemoveFromWaitingListActionData } from "./waiting-list/remove-from-waiting-list";
import { removeFromWaitingListSchema } from "./waiting-list/remove-from-waiting-list";

export const loader = async (args: LoaderArgs) => {
  const { request, params } = args;
  const response = new Response();
  const authClient = createAuthClient(request, response);
  await checkFeatureAbilitiesOrThrow(authClient, "events");
  const slug = getParamValueOrThrow(params, "slug");
  const sessionUser = await getSessionUserOrThrow(authClient);
  const event = await getEventBySlugOrThrow(slug);
  await checkOwnershipOrThrow(event, sessionUser);

  const participants = getParticipantsDataFromEvent(event);
  const enhancedWaitingParticipants = participants.waitingList.map(
    (waitingParticipant) => {
      if (waitingParticipant.avatar !== null) {
        const publicURL = getPublicURL(authClient, waitingParticipant.avatar);
        if (publicURL !== null) {
          waitingParticipant.avatar = getImageURL(publicURL, {
            resize: { type: "fill", width: 64, height: 64 },
            gravity: GravityType.center,
          });
        }
      }
      return waitingParticipant;
    }
  );

  const url = new URL(request.url);
  const suggestionsQuery =
    url.searchParams.get("autocomplete_query") || undefined;
  let waitingParticipantSuggestions;
  if (suggestionsQuery !== undefined && suggestionsQuery !== "") {
    const query = suggestionsQuery.split(" ");
    const alreadyParticipantIds = participants.participants.map(
      (participant) => {
        return participant.id;
      }
    );
    const alreadyWaitingParticipantIds = participants.waitingList.map(
      (waitingParticipant) => {
        return waitingParticipant.id;
      }
    );
    const alreadyParticipatingIds = [
      ...alreadyParticipantIds,
      ...alreadyWaitingParticipantIds,
    ];
    waitingParticipantSuggestions = await getWaitingParticipantSuggestions(
      authClient,
      alreadyParticipatingIds,
      query
    );
  }

  const fullDepthWaitingList = await getFullDepthProfiles(
    event.id,
    "waitingList"
  );

  return json(
    {
      userId: sessionUser.id,
      eventId: event.id,
      waitingList: enhancedWaitingParticipants,
      waitingParticipantSuggestions,
      hasFullDepthWaitingList:
        fullDepthWaitingList !== null &&
        fullDepthWaitingList.length > 0 &&
        event._count.childEvents !== 0,
    },
    { headers: response.headers }
  );
};

function Participants() {
  const { slug } = useParams();
  const loaderData = useLoaderData<typeof loader>();
  const addToWaitingListFetcher = useFetcher<
    SuccessActionData | FailureActionData
  >();
  const removeFromWaitingListFetcher =
    useFetcher<RemoveFromWaitingListActionData>();
  const moveToParticipantsFetcher = useFetcher<MoveToParticipantsActionData>();
  const [searchParams] = useSearchParams();
  const suggestionsQuery = searchParams.get("autocomplete_query");
  const submit = useSubmit();

  return (
    <>
      <h1 className="mb-8">Warteliste</h1>
      <p className="mb-8">
        Wer wartet aktuell auf eine Teilnahme? Füge hier weitere Teilnehmende
        der Warteliste hinzu oder füge Wartende der Teilnehmendenliste hinzu.
      </p>
      <h4 className="mb-4 font-semibold">Zur Warteliste hinzufügen</h4>
      <p className="mb-8">
        Füge hier der Warteliste ein bereits bestehendes Profil hinzu.
      </p>
      <Form
        schema={addToWaitingListSchema}
        fetcher={addToWaitingListFetcher}
        action={`/event/${slug}/settings/waiting-list/add-to-waiting-list`}
        hiddenFields={["eventId", "userId"]}
        values={{ eventId: loaderData.eventId, userId: loaderData.userId }}
        onSubmit={() => {
          submit({
            method: "get",
            action: `/event/${slug}/settings/waiting-list`,
          });
        }}
      >
        {({ Field, Errors, Button, register }) => {
          return (
            <>
              <Field name="eventId" />
              <Field name="userId" />
              <div className="form-control w-full">
                <div className="flex flex-row items-center mb-2">
                  <div className="flex-auto">
                    <label id="label-for-name" htmlFor="Name" className="label">
                      Name der wartenden Person
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
                            loaderData.waitingParticipantSuggestions || []
                          }
                          suggestionsLoaderPath={`/event/${slug}/settings/waiting-list`}
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
      {addToWaitingListFetcher.data !== undefined &&
      "message" in addToWaitingListFetcher.data ? (
        <div className={`p-4 bg-green-200 rounded-md mt-4`}>
          {addToWaitingListFetcher.data.message}
        </div>
      ) : null}
      {loaderData.waitingList.length > 0 ? (
        <>
          <h4 className="mb-4 mt-16 font-semibold">Warteliste</h4>
          <p className="mb-4">
            Folgende Profile stehen aktuell auf der Warteliste (in Reihenfolge
            ihrer Anmeldung.)
          </p>
        </>
      ) : null}
      {loaderData.waitingList.length > 0 ? (
        <p className="mb-4">
          <Link
            className="btn btn-outline btn-primary mt-4 mb-4"
            to="../csv-download?type=waitingList&amp;depth=single"
            reloadDocument
          >
            Warteliste herunterladen
          </Link>
        </p>
      ) : null}
      {loaderData.hasFullDepthWaitingList ? (
        <p className="mb-4">
          <Link
            className="btn btn-outline btn-primary mt-4 mb-4"
            to="../csv-download?type=waitingList&amp;depth=full"
            reloadDocument
          >
            Warteliste aller Subveranstaltungen herunterladen
          </Link>
        </p>
      ) : null}

      <div className="mb-4 mt-8 md:max-h-[630px] overflow-auto">
        {moveToParticipantsFetcher.data !== undefined &&
          moveToParticipantsFetcher.data.success === true && (
            <div>Teilnehmende wurde hinzugefügt und per E-Mail informiert.</div>
          )}
        {loaderData.waitingList.map((waitingParticipant) => {
          const initials = getInitials(waitingParticipant);
          return (
            <div
              key={waitingParticipant.id}
              className="w-full flex items-center flex-row flex-wrap sm:flex-nowrap border-b border-neutral-400 py-4 md:px-4"
            >
              <div className="h-16 w-16 bg-primary text-white text-3xl flex items-center justify-center rounded-full border overflow-hidden shrink-0">
                {waitingParticipant.avatar !== null &&
                waitingParticipant.avatar !== "" ? (
                  <img src={waitingParticipant.avatar} alt={initials} />
                ) : (
                  <>{initials}</>
                )}
              </div>
              <div className="pl-4">
                <Link to={`/profile/${waitingParticipant.username}`}>
                  <H3
                    like="h4"
                    className="text-xl mb-1 no-underline hover:underline"
                  >
                    {waitingParticipant.firstName} {waitingParticipant.lastName}
                  </H3>
                </Link>
                {waitingParticipant.position ? (
                  <p className="font-bold text-sm cursor-default">
                    {waitingParticipant.position}
                  </p>
                ) : null}
              </div>
              <div className="flex-100 sm:flex-auto sm:ml-auto flex items-center flex-row pt-4 sm:pt-0 justify-end">
                <Form
                  schema={moveToParticipantsSchema}
                  fetcher={moveToParticipantsFetcher}
                  action={`/event/${slug}/settings/waiting-list/move-to-participants`}
                  hiddenFields={["userId", "eventId", "profileId"]}
                  values={{
                    userId: loaderData.userId,
                    eventId: loaderData.eventId,
                    profileId: waitingParticipant.id,
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
                        <Field name="profileId" />
                        <Button className="btn btn-outline-primary ml-auto btn-small">
                          Zu Teilnehmenden hinzufügen
                        </Button>
                      </>
                    );
                  }}
                </Form>
                <Form
                  schema={removeFromWaitingListSchema}
                  fetcher={removeFromWaitingListFetcher}
                  action={`/event/${slug}/settings/waiting-list/remove-from-waiting-list`}
                  hiddenFields={["userId", "eventId", "profileId"]}
                  values={{
                    userId: loaderData.userId,
                    eventId: loaderData.eventId,
                    profileId: waitingParticipant.id,
                  }}
                >
                  {(props) => {
                    const { Field, Button, Errors } = props;
                    return (
                      <>
                        <Errors />
                        <Field name="userId" />
                        <Field name="eventId" />
                        <Field name="profileId" />
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
            </div>
          );
        })}
      </div>
    </>
  );
}

export default Participants;
