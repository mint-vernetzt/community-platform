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
import type {
  FailureActionData,
  SuccessActionData,
} from "./participants/add-participant";
import { addParticipantSchema } from "./participants/add-participant";
import type { ActionData as RemoveParticipantActionData } from "./participants/remove-participant";
import { removeParticipantSchema } from "./participants/remove-participant";
import {
  checkOwnershipOrThrow,
  getParticipantSuggestions,
  getParticipantsDataFromEvent,
} from "./utils.server";

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
  const enhancedParticipants = participants.participants.map((participant) => {
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
  });

  const url = new URL(request.url);
  const suggestionsQuery =
    url.searchParams.get("autocomplete_query") || undefined;
  let participantSuggestions;
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
    participantSuggestions = await getParticipantSuggestions(
      authClient,
      alreadyParticipatingIds,
      query
    );
  }

  const fullDepthParticipants = await getFullDepthProfiles(
    event.id,
    "participants"
  );

  return json(
    {
      userId: sessionUser.id,
      eventId: event.id,
      participants: enhancedParticipants,
      participantSuggestions,
      hasFullDepthParticipants:
        fullDepthParticipants !== null &&
        fullDepthParticipants.length > 0 &&
        event._count.childEvents !== 0,
    },
    { headers: response.headers }
  );
};

function Participants() {
  const { slug } = useParams();
  const loaderData = useLoaderData<typeof loader>();
  const addParticipantFetcher = useFetcher<
    SuccessActionData | FailureActionData
  >();
  const removeParticipantFetcher = useFetcher<RemoveParticipantActionData>();
  const [searchParams] = useSearchParams();
  const suggestionsQuery = searchParams.get("autocomplete_query");
  const submit = useSubmit();

  return (
    <>
      <h1 className="mb-8">Teilnehmende</h1>
      <p className="mb-8">
        Wer nimmt an der Veranstaltung teil? Füge hier weitere Teilnehmende
        hinzu oder entferne sie. Außerdem kannst Du eine Begrenzung der
        Teilnehmenden festlegen.
      </p>
      <h4 className="mb-4 font-semibold">Begrenzung der Teilnehmenden</h4>
      <p className="mb-8">
        Hier kann die Teilnehmerzahl begrenzt werden. Auch wenn die
        Teilnehmerzahl erreicht ist kannst du später noch manuell Personen von
        der Warteliste zu den Teilnehmenden verschieben.
      </p>
      {/* TODO: Form with zod and conform. Below is the original one */}
      {/* <div className="mb-6">
            <InputText
              {...register("participantLimit")}
              id="participantLimit"
              label="Begrenzung der Teilnehmenden"
              defaultValue={event.participantLimit || ""}
              errorMessage={errors?.participantLimit?.message}
              type="number"
              withPublicPrivateToggle={false}
              isPublic={eventVisibilities.participantLimit}
            />
            {errors?.participantLimit?.message ? (
              <div>{errors.participantLimit.message}</div>
            ) : null}
          </div> */}
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
          onSubmit={() => {
            submit({
              method: "get",
              action: `/event/${slug}/settings/participants`,
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
                      <label
                        id="label-for-name"
                        htmlFor="Name"
                        className="label"
                      >
                        Name der Teilnehmer:in
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
                              loaderData.participantSuggestions || []
                            }
                            suggestionsLoaderPath={`/event/${slug}/settings/participants`}
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
        {addParticipantFetcher.data !== undefined &&
        "message" in addParticipantFetcher.data ? (
          <div className={`p-4 bg-green-200 rounded-md mt-4`}>
            {addParticipantFetcher.data.message}
          </div>
        ) : null}
      </div>
      <h4 className="mb-4 mt-16 font-semibold">Aktuelle Teilnehmende</h4>
      <p className="mb-4">Hier siehst du alle Teilnehmenden auf einen Blick.</p>
      {loaderData.participants.length > 0 ? (
        <p className="mb-4">
          <Link
            className="btn btn-outline btn-primary mt-4 mb-4"
            to="../csv-download?type=participants&amp;depth=single"
            reloadDocument
          >
            Teilnehmerliste herunterladen
          </Link>
        </p>
      ) : null}
      {loaderData.hasFullDepthParticipants ? (
        <p className="mb-4">
          <Link
            className="btn btn-outline btn-primary mt-4 mb-4"
            to="../csv-download?type=participants&amp;depth=full"
            reloadDocument
          >
            Teilnehmerliste aller Subveranstaltungen herunterladen
          </Link>
        </p>
      ) : null}
      <div className="mb-4 mt-8 md:max-h-[630px] overflow-auto">
        {loaderData.participants.map((participant) => {
          const initials = getInitials(participant);
          return (
            <div
              key={participant.id}
              className="w-full flex items-center flex-row border-b border-neutral-400 p-4"
            >
              <div className="h-16 w-16 bg-primary text-white text-3xl flex items-center justify-center rounded-full border overflow-hidden shrink-0">
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
          );
        })}
      </div>
    </>
  );
}

export default Participants;
