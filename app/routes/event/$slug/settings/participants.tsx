import { LoaderFunction } from "@remix-run/node";
import { Link, useFetcher, useLoaderData, useParams } from "@remix-run/react";
import { Form } from "remix-forms";
import { getUserByRequestOrThrow } from "~/auth.server";
import { H3 } from "~/components/Heading/Heading";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import {
  getEventBySlugOrThrow,
  getFullDepthParticipants,
  getFullDepthWaitingList,
} from "../utils.server";
import { addParticipantSchema } from "./participants/add-participant";
import { addToWaitingListSchema } from "./participants/add-to-waiting-list";
import { moveToParticipantsSchema } from "./participants/move-to-participants";
import { removeFromWaitingListSchema } from "./participants/remove-from-waiting-list";
import { removeParticipantSchema } from "./participants/remove-participant";
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

export const loader: LoaderFunction = async (args): Promise<LoaderData> => {
  const { request, params } = args;
  await checkFeatureAbilitiesOrThrow(request, "events");
  const slug = getParamValueOrThrow(params, "slug");
  const currentUser = await getUserByRequestOrThrow(request);
  const event = await getEventBySlugOrThrow(slug);
  await checkOwnershipOrThrow(event, currentUser);

  const participantsData = getParticipantsDataFromEvent(event);

  const { participantLimit } = event;

  const fullDepthParticipants = await getFullDepthParticipants(event.id);
  const fullDepthWaitingList = await getFullDepthWaitingList(event.id);

  return {
    userId: currentUser.id,
    eventId: event.id,
    ...participantsData,
    participantLimit,
    hasFullDepthParticipants:
      fullDepthParticipants !== null &&
      fullDepthParticipants.length > 0 &&
      event._count.childEvents !== 0,
    hasFullDepthWaitingList:
      fullDepthWaitingList !== null &&
      fullDepthWaitingList.length > 0 &&
      event._count.childEvents !== 0,
  };
};

function Participants() {
  const { slug } = useParams();
  const loaderData = useLoaderData<LoaderData>();
  const setParticipantLimitFetcher = useFetcher();
  const addParticipantFetcher = useFetcher();
  const removeParticipantFetcher = useFetcher();
  const addToWaitingListFetcher = useFetcher();
  const removeFromWaitingListFetcher = useFetcher();
  const moveToParticipantsFetcher = useFetcher();

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
        {setParticipantLimitFetcher.data?.message && (
          <div className="p-4 bg-green-200 rounded-md mt-4">
            {setParticipantLimitFetcher.data.message}
          </div>
        )}
      </div>
      <div className="mb-8">
        <h3>Teilnehmende</h3>
        <ul>
          {loaderData.participants.map((item) => {
            return (
              <div
                key={item.id}
                className="w-full flex items-center flex-row border-b border-neutral-400 p-4"
              >
                <div className="pl-4">
                  <H3 like="h4" className="text-xl mb-1">
                    <Link
                      className="underline hover:no-underline"
                      to={`/profile/${item.username}`}
                    >
                      {item.firstName} {item.lastName}
                    </Link>
                  </H3>
                </div>
                <Form
                  schema={removeParticipantSchema}
                  fetcher={removeParticipantFetcher}
                  action={`/event/${slug}/settings/participants/remove-participant`}
                  hiddenFields={["userId", "eventId", "profileId"]}
                  values={{
                    userId: loaderData.userId,
                    eventId: loaderData.eventId,
                    profileId: item.id,
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
        {removeParticipantFetcher.data?.message && (
          <div className="p-4 bg-green-200 rounded-md mt-4">
            {removeParticipantFetcher.data.message}
          </div>
        )}
        {loaderData.participants.length > 0 && (
          <Link
            className="btn btn-outline btn-primary mt-4"
            to="csv-download?type=participants&amp;depth=single"
            reloadDocument
          >
            Teilnehmerliste herunterladen
          </Link>
        )}
        {loaderData.hasFullDepthParticipants && (
          <Link
            className="btn btn-outline btn-primary mt-4"
            to="csv-download?type=participants&amp;depth=full"
            reloadDocument
          >
            Teilnehmerliste aller Subveranstaltungen herunterladen
          </Link>
        )}
      </div>
      <h4 className="mb-4 font-semibold">Teilnehmende hinzufügen</h4>
      <p className="mb-8">Lorem Ipsum</p>
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
        {addParticipantFetcher.data?.message && (
          <div className="p-4 bg-green-200 rounded-md mt-4">
            {addParticipantFetcher.data.message}
          </div>
        )}
      </div>
      <div className="mb-8">
        <h3>Warteliste</h3>
        <ul>
          {loaderData.waitingList.map((item) => {
            return (
              <div
                key={item.id}
                className="w-full flex items-center flex-row border-b border-neutral-400 p-4"
              >
                <div className="pl-4">
                  <H3 like="h4" className="text-xl mb-1">
                    <Link
                      className="underline hover:no-underline"
                      to={`/profile/${item.username}`}
                    >
                      {item.firstName} {item.lastName}
                    </Link>
                  </H3>
                </div>
                <Form
                  schema={moveToParticipantsSchema}
                  fetcher={moveToParticipantsFetcher}
                  action={`/event/${slug}/settings/participants/move-to-participants`}
                  hiddenFields={["userId", "eventId", "profileId"]}
                  values={{
                    userId: loaderData.userId,
                    eventId: loaderData.eventId,
                    profileId: item.id,
                  }}
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
                    profileId: item.id,
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
        {removeFromWaitingListFetcher.data?.message && (
          <div className="p-4 bg-green-200 rounded-md mt-4">
            {removeFromWaitingListFetcher.data.message}
          </div>
        )}
        {loaderData.waitingList.length > 0 && (
          <>
            <Link
              className="btn btn-outline btn-primary mt-4"
              to="csv-download?type=waitingList&amp;depth=single"
              reloadDocument
            >
              Warteliste herunterladen
            </Link>
          </>
        )}
        {loaderData.hasFullDepthWaitingList && (
          <>
            <Link
              className="btn btn-outline btn-primary mt-4"
              to="csv-download?type=waitingList&amp;depth=full"
              reloadDocument
            >
              Warteliste aller Subveranstaltungen herunterladen
            </Link>
          </>
        )}
      </div>
      <h4 className="mb-4 font-semibold">Zur Warteliste hinzufügen</h4>
      <p className="mb-8">Lorem Ipsum</p>
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
        {addToWaitingListFetcher.data?.message && (
          <div className="p-4 bg-green-200 rounded-md mt-4">
            {addToWaitingListFetcher.data.message}
          </div>
        )}
      </div>
    </>
  );
}

export default Participants;
