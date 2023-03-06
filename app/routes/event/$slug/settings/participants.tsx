import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useFetcher, useLoaderData, useParams } from "@remix-run/react";
import { GravityType } from "imgproxy/dist/types";
import { Form } from "remix-forms";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { H3 } from "~/components/Heading/Heading";
import { getImageURL } from "~/images.server";
import { getInitials } from "~/lib/profile/getInitials";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { getPublicURL } from "~/storage.server";
import { getEventBySlugOrThrow, getFullDepthProfiles } from "../utils.server";
import type { ActionData as AddParticipantActionData } from "./participants/add-participant";
import { addParticipantSchema } from "./participants/add-participant";
import type { ActionData as AddToWaitingListActionData } from "./participants/add-to-waiting-list";
import { addToWaitingListSchema } from "./participants/add-to-waiting-list";
import type { ActionData as MoveToParticipantsActionData } from "./participants/move-to-participants";
import { moveToParticipantsSchema } from "./participants/move-to-participants";
import type { ActionData as RemoveFromWaitingListActionData } from "./participants/remove-from-waiting-list";
import { removeFromWaitingListSchema } from "./participants/remove-from-waiting-list";
import type { ActionData as RemoveParticipantActionData } from "./participants/remove-participant";
import { removeParticipantSchema } from "./participants/remove-participant";
import type { ActionData as SetParticipantLimitActionData } from "./participants/set-participant-limit";
import { setParticipantLimitSchema } from "./participants/set-participant-limit";
import {
  checkOwnershipOrThrow,
  getParticipantsDataFromEvent,
} from "./utils.server";

type LoaderData = {
  userId: string;
  eventId: string;
  participantLimit: number | null;
  hasFullDepthParticipants: boolean;
  hasFullDepthWaitingList: boolean;
} & ReturnType<typeof getParticipantsDataFromEvent>;

export const loader: LoaderFunction = async (args) => {
  const { request, params } = args;
  const response = new Response();
  const authClient = createAuthClient(request, response);
  await checkFeatureAbilitiesOrThrow(authClient, "events");
  const slug = getParamValueOrThrow(params, "slug");
  const sessionUser = await getSessionUserOrThrow(authClient);
  const event = await getEventBySlugOrThrow(slug);
  await checkOwnershipOrThrow(event, sessionUser);

  const participantsData = getParticipantsDataFromEvent(event);

  const enhancedParticipants = participantsData.participants.map(
    (participant) => {
      if (participant.avatar !== null) {
        const publicURL = getPublicURL(authClient, participant.avatar);
        if (publicURL !== null) {
          participant.avatar = getImageURL(publicURL, {
            resize: { type: "fill", width: 64, height: 64 },
            gravity: GravityType.center,
          });
        }
      }
      return participant;
    }
  );

  const enhancedWaitingParticipants = participantsData.waitingList.map(
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

  const { participantLimit } = event;

  const fullDepthParticipants = await getFullDepthProfiles(
    event.id,
    "participants"
  );

  const fullDepthWaitingList = await getFullDepthProfiles(
    event.id,
    "waitingList"
  );

  return json<LoaderData>(
    {
      userId: sessionUser.id,
      eventId: event.id,
      participants: enhancedParticipants,
      waitingList: enhancedWaitingParticipants,
      participantLimit,
      hasFullDepthParticipants:
        fullDepthParticipants !== null &&
        fullDepthParticipants.length > 0 &&
        event._count.childEvents !== 0,
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
  const loaderData = useLoaderData<LoaderData>();
  const setParticipantLimitFetcher =
    useFetcher<SetParticipantLimitActionData>();
  const addParticipantFetcher = useFetcher<AddParticipantActionData>();
  const removeParticipantFetcher = useFetcher<RemoveParticipantActionData>();
  const addToWaitingListFetcher = useFetcher<AddToWaitingListActionData>();
  const removeFromWaitingListFetcher =
    useFetcher<RemoveFromWaitingListActionData>();
  const moveToParticipantsFetcher = useFetcher<MoveToParticipantsActionData>();

  return (
    <>
      <div className="mb-8">
        <h4 className="mb-4 font-semibold">
          Anzahl der Teilnehmenden begrenzen
        </h4>
        <p className="mb-8">lorem ipsum</p>
        <Form
          schema={setParticipantLimitSchema}
          fetcher={setParticipantLimitFetcher}
          action={`/event/${slug}/settings/participants/set-participant-limit`}
          hiddenFields={["eventId", "userId"]}
          values={{
            eventId: loaderData.eventId,
            userId: loaderData.userId,
            participantLimit: loaderData.participantLimit,
          }}
        >
          {(props) => {
            const { Field, Errors, Button } = props;
            return (
              <>
                <div className="form-control w-full">
                  <div className="flex flex-row items-center mb-2">
                    <div className="flex-auto">
                      <label htmlFor="participantLimit" className="label">
                        maximale Anzahl der Teilnehmer
                      </label>
                    </div>
                  </div>
                  <div className="flex flex-row">
                    <Field name="eventId" />
                    <Field name="userId" />
                    <Field name="participantLimit">
                      {(props) => {
                        const { Errors } = props;
                        return (
                          <>
                            <input
                              id="participantLimit"
                              name="participantLimit"
                              type="number"
                              className="input input-bordered w-full"
                            />
                            <Errors />
                          </>
                        );
                      }}
                    </Field>
                    <div className="ml-2">
                      <Button className="btn btn-outline-primary ml-auto btn-small">
                        Aktualisieren
                      </Button>
                    </div>
                  </div>
                </div>
                <Errors />
              </>
            );
          }}
        </Form>
        {setParticipantLimitFetcher.data?.message ? (
          <div className="p-4 bg-green-200 rounded-md mt-4">
            {setParticipantLimitFetcher.data.message}
          </div>
        ) : null}
      </div>
      <h1 className="mb-8">Teilnehmende</h1>
      <p className="mb-8">
        Wer nimmt an der Veranstaltung teil? Füge hier weitere Teilnehmende
        hinzu oder entferne sie.
      </p>
      <ul>
        {loaderData.participants.map((participant) => {
          const initials = getInitials(participant);
          return (
            <div
              key={participant.id}
              className="w-full flex items-center flex-row border-b border-neutral-400 p-4"
            >
              <div className="h-16 w-16 bg-primary text-white text-3xl flex items-center justify-center rounded-full border overflow-hidden">
                {participant.avatar !== null && participant.avatar !== "" ? (
                  <img src={participant.avatar} alt={initials} />
                ) : (
                  <>{initials}</>
                )}
              </div>
              <div className="pl-4">
                <Link to={`/profile/${participant.username}`}>
                  <H3
                    like="h4"
                    className="text-xl mb-1 no-underline hover:underline"
                  >
                    {participant.firstName} {participant.lastName}
                  </H3>
                </Link>
                {participant.position ? (
                  <p className="font-bold text-sm cursor-default">
                    {participant.position}
                  </p>
                ) : null}
              </div>
              <Form
                schema={removeParticipantSchema}
                fetcher={removeParticipantFetcher}
                action={`/event/${slug}/settings/participants/remove-participant`}
                hiddenFields={["userId", "eventId", "profileId"]}
                values={{
                  userId: loaderData.userId,
                  eventId: loaderData.eventId,
                  profileId: participant.id,
                }}
                className="ml-auto"
              >
                {(props) => {
                  const { Field, Button } = props;
                  return (
                    <>
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
          );
        })}
      </ul>
      {removeParticipantFetcher.data?.message ? (
        <div className="p-4 bg-green-200 rounded-md mt-4 mb-4">
          {removeParticipantFetcher.data.message}
        </div>
      ) : null}
      {loaderData.participants.length > 0 ? (
        <Link
          className="btn btn-outline btn-primary mt-4 mb-4"
          to="csv-download?type=participants&amp;depth=single"
          reloadDocument
        >
          Teilnehmerliste herunterladen
        </Link>
      ) : null}
      {loaderData.hasFullDepthParticipants ? (
        <Link
          className="btn btn-outline btn-primary mt-4 mb-4"
          to="csv-download?type=participants&amp;depth=full"
          reloadDocument
        >
          Teilnehmerliste aller Subveranstaltungen herunterladen
        </Link>
      ) : null}
      <h4 className="mb-4 font-semibold">Teilnehmende hinzufügen</h4>
      <p className="mb-8">
        Füge hier Eurer Veranstaltung ein bereits bestehendes Profil als
        Teilnehmende hinzu.
      </p>
      <div className="mb-8">
        <Form
          schema={addParticipantSchema}
          fetcher={addParticipantFetcher}
          action={`/event/${slug}/settings/participants/add-participant`}
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
        {addParticipantFetcher.data?.message ? (
          <div className="p-4 bg-green-200 rounded-md mt-4">
            {addParticipantFetcher.data.message}
          </div>
        ) : null}
      </div>
      <h1 className="mb-8">Warteliste</h1>
      <p className="mb-8">
        Wer wartet aktuell auf eine Teilnahme? Füge hier weitere Teilnehmende
        der Warteliste hinzu oder füge Wartende der Teilnehmendenliste hinzu.
      </p>
      <ul>
        {loaderData.waitingList.map((waitingParticipant) => {
          const initials = getInitials(waitingParticipant);
          return (
            <div
              key={waitingParticipant.id}
              className="w-full flex items-center flex-row border-b border-neutral-400 p-4"
            >
              <div className="h-16 w-16 bg-primary text-white text-3xl flex items-center justify-center rounded-full border overflow-hidden">
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
              <Form
                schema={moveToParticipantsSchema}
                fetcher={moveToParticipantsFetcher}
                action={`/event/${slug}/settings/participants/move-to-participants`}
                hiddenFields={["userId", "eventId", "profileId"]}
                values={{
                  userId: loaderData.userId,
                  eventId: loaderData.eventId,
                  profileId: waitingParticipant.id,
                }}
                className="ml-auto"
              >
                {(props) => {
                  const { Field, Button } = props;
                  return (
                    <>
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
                action={`/event/${slug}/settings/participants/remove-from-waiting-list`}
                hiddenFields={["userId", "eventId", "profileId"]}
                values={{
                  userId: loaderData.userId,
                  eventId: loaderData.eventId,
                  profileId: waitingParticipant.id,
                }}
              >
                {(props) => {
                  const { Field, Button } = props;
                  return (
                    <>
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
          );
        })}
      </ul>
      {removeFromWaitingListFetcher.data?.message ? (
        <div className="p-4 bg-green-200 rounded-md mt-4 mb-4">
          {removeFromWaitingListFetcher.data.message}
        </div>
      ) : null}
      {loaderData.waitingList.length > 0 ? (
        <>
          <Link
            className="btn btn-outline btn-primary mt-4 mb-4"
            to="csv-download?type=waitingList&amp;depth=single"
            reloadDocument
          >
            Warteliste herunterladen
          </Link>
        </>
      ) : null}
      {loaderData.hasFullDepthWaitingList ? (
        <>
          <Link
            className="btn btn-outline btn-primary mt-4 mb-4"
            to="csv-download?type=waitingList&amp;depth=full"
            reloadDocument
          >
            Warteliste aller Subveranstaltungen herunterladen
          </Link>
        </>
      ) : null}
      <h4 className="mb-4 font-semibold">Zur Warteliste hinzufügen</h4>
      <p className="mb-8">
        Füge hier der Warteliste ein bereits bestehendes Profil hinzu.
      </p>
      <div className="mb-8">
        <Form
          schema={addToWaitingListSchema}
          fetcher={addToWaitingListFetcher}
          action={`/event/${slug}/settings/participants/add-to-waiting-list`}
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
        {addToWaitingListFetcher.data?.message ? (
          <div className="p-4 bg-green-200 rounded-md mt-4">
            {addToWaitingListFetcher.data.message}
          </div>
        ) : null}
      </div>
    </>
  );
}

export default Participants;
