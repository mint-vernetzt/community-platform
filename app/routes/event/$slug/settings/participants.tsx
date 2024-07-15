import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Link,
  useActionData,
  useFetcher,
  useLoaderData,
  useParams,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import { InputError, makeDomainFunction } from "domain-functions";
import { performMutation } from "remix-forms";
import { z } from "zod";
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
  getSessionUserOrThrow,
} from "~/auth.server";
import Autocomplete from "~/components/Autocomplete/Autocomplete";
import InputText from "~/components/FormElements/InputText/InputText";
import { H3 } from "~/components/Heading/Heading";
import { RemixFormsForm } from "~/components/RemixFormsForm/RemixFormsForm";
import { GravityType, getImageURL } from "~/images.server";
import { getInitials } from "~/lib/profile/getInitials";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { getProfileSuggestionsForAutocomplete } from "~/routes/utils.server";
import { getPublicURL } from "~/storage.server";
import { deriveEventMode } from "../../utils.server";
import { getFullDepthProfiles } from "../utils.server";
import { type action as publishAction, publishSchema } from "./events/publish";
import {
  getEventBySlug,
  getEventWithParticipantCount,
  getParticipantsDataFromEvent,
  updateParticipantLimit,
} from "./participants.server";
import {
  type action as addParticipantAction,
  addParticipantSchema,
} from "./participants/add-participant";
import {
  type action as removeParticipantAction,
  removeParticipantSchema,
} from "./participants/remove-participant";
import i18next from "~/i18next.server";
import { type TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { detectLanguage } from "~/root.server";

const createParticipantLimitSchema = (t: TFunction) => {
  return z.object({
    participantLimit: z
      .string({ invalid_type_error: t("validation.participantLimit.type") })
      .regex(/^\d+$/)
      .transform(Number)
      .optional(),
  });
};

const environmentSchema = z.object({
  participantsCount: z.number(),
});

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, [
    "routes/event/settings/participants",
  ]);
  const { authClient } = createAuthClient(request);
  await checkFeatureAbilitiesOrThrow(authClient, "events");
  const slug = getParamValueOrThrow(params, "slug");
  const { sessionUser, redirectPath } =
    await getSessionUserOrRedirectPathToLogin(authClient, request);

  if (sessionUser === null && redirectPath !== null) {
    return redirect(redirectPath);
  }
  const event = await getEventBySlug(slug);
  invariantResponse(event, t("error.notFound"), { status: 404 });
  const mode = await deriveEventMode(sessionUser, slug);
  invariantResponse(mode === "admin", t("error.notPrivileged"), {
    status: 403,
  });

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
    participantSuggestions = await getProfileSuggestionsForAutocomplete(
      authClient,
      alreadyParticipatingIds,
      query
    );
  }

  const fullDepthParticipants = await getFullDepthProfiles(
    event.id,
    "participants"
  );

  return json({
    published: event.published,
    participantLimit: event.participantLimit,
    participants: enhancedParticipants,
    participantSuggestions,
    hasFullDepthParticipants:
      fullDepthParticipants !== null &&
      fullDepthParticipants.length > 0 &&
      event._count.childEvents !== 0,
  });
};

const createMutation = (t: TFunction) => {
  return makeDomainFunction(
    createParticipantLimitSchema(t),
    environmentSchema
  )(async (values, environment) => {
    const participantLimit =
      values.participantLimit === undefined || values.participantLimit <= 0
        ? null
        : values.participantLimit;
    if (participantLimit) {
      if (environment.participantsCount > participantLimit) {
        throw new InputError(t("error.inputError"), "participantLimit");
      }
    }
    return values;
  });
};

export async function action({ request, params }: ActionFunctionArgs) {
  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, [
    "routes/event/settings/participants",
  ]);
  const eventSlug = getParamValueOrThrow(params, "slug");
  const { authClient } = createAuthClient(request);
  await checkFeatureAbilitiesOrThrow(authClient, "events");
  const sessionUser = await getSessionUserOrThrow(authClient);
  const event = await getEventWithParticipantCount(eventSlug);
  invariantResponse(event, "Event not found", { status: 404 });
  const mode = await deriveEventMode(sessionUser, eventSlug);
  invariantResponse(mode === "admin", "Not privileged", { status: 403 });

  const result = await performMutation({
    request,
    schema: createParticipantLimitSchema(t),
    mutation: createMutation(t),
    environment: { participantsCount: event._count.participants },
  });
  if (result.success) {
    // All checked, lets update the event
    await updateParticipantLimit(
      eventSlug,
      result.data.participantLimit || null
    );
  }

  return json(result);
}

function Participants() {
  const { slug } = useParams();
  const loaderData = useLoaderData<typeof loader>();
  const addParticipantFetcher = useFetcher<typeof addParticipantAction>();
  const removeParticipantFetcher = useFetcher<typeof removeParticipantAction>();
  const publishFetcher = useFetcher<typeof publishAction>();
  const [searchParams] = useSearchParams();
  const suggestionsQuery = searchParams.get("autocomplete_query");
  const submit = useSubmit();
  const { t } = useTranslation(["routes/event/settings/participants"]);
  const actionData = useActionData<typeof action>();

  const participantLimitSchema = createParticipantLimitSchema(t);

  return (
    <>
      <h1 className="mb-8">{t("content.headline")}</h1>
      <p className="mb-8">{t("content.intro")}</p>
      <h4 className="mb-4 font-semibold">{t("content.limit.headline")}</h4>
      <p className="mb-8">{t("content.limit.intro")}</p>
      <RemixFormsForm schema={participantLimitSchema}>
        {({ Field, Errors, Button, register }) => {
          return (
            <>
              <Field name="participantLimit" className="mb-4">
                {({ Errors }) => (
                  <>
                    <InputText
                      {...register("participantLimit")}
                      id="participantLimit"
                      label={t("content.limit.label")}
                      defaultValue={loaderData.participantLimit || undefined}
                      type="number"
                      autoFocus
                    />
                    <Errors />
                  </>
                )}
              </Field>
              <div className="flex flex-row">
                <Button type="submit" className="btn btn-primary mb-8">
                  {t("content.limit.submit")}
                </Button>
                <div
                  className={`text-green-500 text-bold ml-4 mt-2 ${
                    actionData?.success ? "block animate-fade-out" : "hidden"
                  }`}
                >
                  {t("content.limit.feedback")}
                </div>
              </div>
            </>
          );
        }}
      </RemixFormsForm>
      <h4 className="mb-4 font-semibold">{t("content.add.headline")}</h4>
      <p className="mb-8">{t("content.add.intro")}</p>
      <div className="mb-8">
        <RemixFormsForm
          schema={addParticipantSchema}
          fetcher={addParticipantFetcher}
          action={`/event/${slug}/settings/participants/add-participant`}
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
                <div className="form-control w-full">
                  <div className="flex flex-row items-center mb-2">
                    <div className="flex-auto">
                      <label
                        id="label-for-name"
                        htmlFor="Name"
                        className="label"
                      >
                        {t("content.add.label")}
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-row">
                    <Field name="profileId" className="flex-auto">
                      {({ Errors }) => (
                        <>
                          <Errors />
                          <Autocomplete
                            suggestions={
                              loaderData.participantSuggestions || []
                            }
                            suggestionsLoaderPath={`/event/${slug}/settings/participants`}
                            defaultValue={suggestionsQuery || ""}
                            {...register("profileId")}
                            searchParameter="autocomplete_query"
                            autoFocus={false}
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
        </RemixFormsForm>
        {addParticipantFetcher.data !== undefined &&
        "message" in addParticipantFetcher.data ? (
          <div className={`p-4 bg-green-200 rounded-md mt-4`}>
            {addParticipantFetcher.data.message}
          </div>
        ) : null}
      </div>
      <h4 className="mb-4 mt-16 font-semibold">
        {t("content.current.headline")}
      </h4>
      <p className="mb-4">{t("content.current.intro")}</p>
      {loaderData.participants.length > 0 ? (
        <p className="mb-4">
          <Link
            className="btn btn-outline btn-primary mt-4 mb-4"
            to="../csv-download?type=participants&amp;depth=single"
            reloadDocument
          >
            {t("content.current.download1")}
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
            {t("content.current.download2")}
          </Link>
        </p>
      ) : null}
      <div className="mb-4 mt-8 @md:mv-max-h-[630px] overflow-auto">
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
              <RemixFormsForm
                schema={removeParticipantSchema}
                fetcher={removeParticipantFetcher}
                action={`/event/${slug}/settings/participants/remove-participant`}
                hiddenFields={["profileId"]}
                values={{
                  profileId: participant.id,
                }}
                className="ml-auto"
              >
                {(props) => {
                  const { Field, Button, Errors } = props;
                  return (
                    <>
                      <Errors />
                      <Field name="profileId" />
                      <Button
                        className="ml-auto btn-none"
                        title={t("content.current.remove")}
                      >
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
              </RemixFormsForm>
            </div>
          );
        })}
      </div>
      <footer className="fixed bg-white border-t-2 border-primary w-full inset-x-0 bottom-0">
        <div className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl">
          <div className="flex flex-row flex-nowrap items-center justify-end my-4">
            <RemixFormsForm
              schema={publishSchema}
              fetcher={publishFetcher}
              action={`/event/${slug}/settings/events/publish`}
              hiddenFields={["publish"]}
              values={{
                publish: !loaderData.published,
              }}
            >
              {(props) => {
                const { Button, Field } = props;
                return (
                  <>
                    <Field name="publish"></Field>
                    <Button className="btn btn-outline-primary">
                      {loaderData.published
                        ? t("content.hide")
                        : t("content.publish")}
                    </Button>
                  </>
                );
              }}
            </RemixFormsForm>
          </div>
        </div>
      </footer>
    </>
  );
}

export default Participants;
