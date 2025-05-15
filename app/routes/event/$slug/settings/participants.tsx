import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  Link,
  useActionData,
  useFetcher,
  useLoaderData,
  useParams,
  useSearchParams,
  useSubmit,
  redirect,
} from "react-router";
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
import { BlurFactor, ImageSizes, getImageURL } from "~/images.server";
import { getInitials } from "~/lib/profile/getInitials";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { detectLanguage } from "~/root.server";
import { getProfileSuggestionsForAutocomplete } from "~/routes/utils.server";
import { getPublicURL } from "~/storage.server";
import { deriveEventMode } from "../../utils.server";
import { getFullDepthProfiles } from "../utils.server";
import { type action as publishAction, publishSchema } from "./events/publish";
import {
  type EventParticipantsLocales,
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
import { Avatar } from "@mint-vernetzt/components/src/molecules/Avatar";
import { languageModuleMap } from "~/locales/.server";

const createParticipantLimitSchema = (locales: EventParticipantsLocales) => {
  return z.object({
    participantLimit: z
      .string({
        invalid_type_error: locales.route.validation.participantLimit.type,
      })
      .regex(/^\d+$/)
      .optional()
      .transform((value) => {
        if (value === undefined) {
          return null;
        }
        const trimmedValue = value.trim();
        if (trimmedValue === "") {
          return null;
        }
        const parsedValue = parseInt(trimmedValue, 10);
        if (parsedValue === 0) {
          return null;
        }
        return parsedValue;
      }),
  });
};

const environmentSchema = z.object({
  participantsCount: z.number(),
});

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["event/$slug/settings/participants"];
  const { authClient } = createAuthClient(request);
  await checkFeatureAbilitiesOrThrow(authClient, "events");
  const slug = getParamValueOrThrow(params, "slug");
  const { sessionUser, redirectPath } =
    await getSessionUserOrRedirectPathToLogin(authClient, request);

  if (sessionUser === null && redirectPath !== null) {
    return redirect(redirectPath);
  }
  const event = await getEventBySlug(slug);
  invariantResponse(event, locales.route.error.notFound, { status: 404 });
  const mode = await deriveEventMode(sessionUser, slug);
  invariantResponse(mode === "admin", locales.route.error.notPrivileged, {
    status: 403,
  });

  const participants = getParticipantsDataFromEvent(event);
  const enhancedParticipants = participants.participants.map((participant) => {
    let avatar = participant.avatar;
    let blurredAvatar;
    if (avatar !== null) {
      const publicURL = getPublicURL(authClient, avatar);
      if (publicURL !== null) {
        avatar = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width:
              ImageSizes.Profile.ListItemEventAndOrganizationSettings.Avatar
                .width,
            height:
              ImageSizes.Profile.ListItemEventAndOrganizationSettings.Avatar
                .height,
          },
        });
        blurredAvatar = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width:
              ImageSizes.Profile.ListItemEventAndOrganizationSettings
                .BlurredAvatar.width,
            height:
              ImageSizes.Profile.ListItemEventAndOrganizationSettings
                .BlurredAvatar.height,
          },
          blur: BlurFactor,
        });
      }
    }
    return { ...participant, avatar, blurredAvatar };
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

  return {
    published: event.published,
    participantLimit: event.participantLimit,
    participants: enhancedParticipants,
    participantSuggestions,
    hasFullDepthParticipants:
      fullDepthParticipants !== null &&
      fullDepthParticipants.length > 0 &&
      event._count.childEvents !== 0,
    locales,
    language,
  };
};

const createMutation = (locales: EventParticipantsLocales) => {
  return makeDomainFunction(
    createParticipantLimitSchema(locales),
    environmentSchema
  )(async (values, environment) => {
    if (values.participantLimit !== null) {
      if (environment.participantsCount > values.participantLimit) {
        throw new InputError(
          locales.route.error.inputError,
          "participantLimit"
        );
      }
    }
    return values;
  });
};

export async function action({ request, params }: ActionFunctionArgs) {
  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["event/$slug/settings/participants"];
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
    schema: createParticipantLimitSchema(locales),
    mutation: createMutation(locales),
    environment: { participantsCount: event._count.participants },
  });
  if (result.success) {
    // All checked, lets update the event
    await updateParticipantLimit(
      eventSlug,
      result.data.participantLimit || null
    );
  }

  return { ...result };
}

function Participants() {
  const { slug } = useParams();
  const loaderData = useLoaderData<typeof loader>();
  const { locales, language } = loaderData;
  const addParticipantFetcher = useFetcher<typeof addParticipantAction>();
  const removeParticipantFetcher = useFetcher<typeof removeParticipantAction>();
  const publishFetcher = useFetcher<typeof publishAction>();
  const [searchParams] = useSearchParams();
  const suggestionsQuery = searchParams.get("autocomplete_query");
  const submit = useSubmit();
  const actionData = useActionData<typeof action>();

  const participantLimitSchema = createParticipantLimitSchema(locales);

  return (
    <>
      <h1 className="mv-mb-8">{locales.route.content.headline}</h1>
      <p className="mv-mb-8">{locales.route.content.intro}</p>
      <h4 className="mv-mb-4 mv-font-semibold">
        {locales.route.content.limit.headline}
      </h4>
      <p className="mv-mb-8">{locales.route.content.limit.intro}</p>
      <RemixFormsForm schema={participantLimitSchema}>
        {({ Field, Button, register }) => {
          return (
            <>
              <Field name="participantLimit" className="mv-mb-4">
                {({ Errors }) => (
                  <>
                    <InputText
                      {...register("participantLimit")}
                      id="participantLimit"
                      label={locales.route.content.limit.label}
                      defaultValue={loaderData.participantLimit || undefined}
                      type="number"
                    />
                    <Errors />
                  </>
                )}
              </Field>
              <div className="mv-flex mv-flex-row">
                <Button
                  type="submit"
                  className="mv-mb-8 mv-h-auto mv-min-h-0 mv-whitespace-nowrap mv-py-2 mv-px-6 mv-normal-case mv-leading-6 mv-inline-flex mv-cursor-pointer mv-outline-primary mv-shrink-0 mv-flex-wrap mv-items-center mv-justify-center mv-rounded-lg mv-text-center mv-border-primary mv-text-sm mv-font-semibold mv-border mv-bg-primary mv-text-white"
                >
                  {locales.route.content.limit.submit}
                </Button>
                <div
                  className={`mv-text-green-500 mv-text-bold mv-ml-4 mv-mt-2 ${
                    actionData?.success ? "mv-block" : "mv-hidden"
                  }`}
                >
                  {locales.route.content.limit.feedback}
                </div>
              </div>
            </>
          );
        }}
      </RemixFormsForm>
      <h4 className="mv-mb-4 mv-font-semibold">
        {locales.route.content.add.headline}
      </h4>
      <p className="mv-mb-8">{locales.route.content.add.intro}</p>
      <div className="mv-mb-8">
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
          {({ Field, Button, register }) => {
            return (
              <>
                <div className="mv-flex mv-flex-col mv-gap-2 mv-w-full">
                  <div className="mv-flex mv-flex-row mv-items-center mv-mb-2">
                    <div className="mv-flex-auto">
                      <label
                        id="label-for-name"
                        htmlFor="Name"
                        className="mv-font-semibold"
                      >
                        {locales.route.content.add.label}
                      </label>
                    </div>
                  </div>

                  <div className="mv-flex mv-flex-row">
                    <Field name="profileId" className="mv-flex-auto">
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
                            locales={locales}
                            currentLanguage={language}
                          />
                        </>
                      )}
                    </Field>
                    <div className="mv-ml-2">
                      <Button className="mv-bg-transparent mv-w-10 mv-h-8 mv-flex mv-items-center mv-justify-center mv-rounded-md mv-border-2 mv-border-neutral-300 mv-text-neutral-600 mv-mt-0.5 hover:mv-bg-neutral-100">
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
          <div className={`mv-p-4 mv-bg-green-200 mv-rounded-md mv-mt-4`}>
            {addParticipantFetcher.data.message}
          </div>
        ) : null}
      </div>
      <h4 className="mv-mb-4 mv-mt-16 mv-font-semibold">
        {locales.route.content.current.headline}
      </h4>
      <p className="mv-mb-4">{locales.route.content.current.intro}</p>
      {loaderData.participants.length > 0 ? (
        <p className="mv-mb-4">
          <Link
            className="mv-mt-4 mv-mb-4 mv-border mv-border-primary mv-bg-white mv-text-primary mv-h-auto mv-min-h-0 mv-whitespace-nowrap mv-py-2 mv-px-6 mv-normal-case mv-leading-6 mv-inline-flex mv-cursor-pointer mv-selct-none mv-flex-wrap mv-items-center mv-justify-center mv-rounded-lg mv-text-center mv-font-semibold mv-gap-2 hover:mv-bg-primary hover:mv-text-white"
            to="../csv-download?type=participants&amp;depth=single"
            reloadDocument
          >
            {locales.route.content.current.download1}
          </Link>
        </p>
      ) : null}
      {loaderData.hasFullDepthParticipants ? (
        <p className="mv-mb-4">
          <Link
            className="mv-mt-4 mv-mb-4 mv-border mv-border-primary mv-bg-white mv-text-primary mv-h-auto mv-min-h-0 mv-whitespace-nowrap mv-py-2 mv-px-6 mv-normal-case mv-leading-6 mv-inline-flex mv-cursor-pointer mv-selct-none mv-flex-wrap mv-items-center mv-justify-center mv-rounded-lg mv-text-center mv-font-semibold mv-gap-2 hover:mv-bg-primary hover:mv-text-white"
            to="../csv-download?type=participants&amp;depth=full"
            reloadDocument
          >
            {locales.route.content.current.download2}
          </Link>
        </p>
      ) : null}
      <div className="mv-mb-4 mv-mt-8 @md:mv-max-h-[630px] mv-overflow-auto">
        {loaderData.participants.map((participant) => {
          const initials = getInitials(participant);
          return (
            <div
              key={participant.id}
              className="mv-w-full mv-flex mv-items-center mv-flex-row mv-border-b mv-border-neutral-400 mv-p-4"
            >
              <div className="mv-h-16 mv-w-16 mv-bg-primary mv-text-white mv-text-3xl mv-flex mv-items-center mv-justify-center mv-rounded-full mv-border mv-overflow-hidden mv-shrink-0">
                {participant.avatar !== null && participant.avatar !== "" ? (
                  <Avatar
                    size="full"
                    firstName={participant.firstName}
                    lastName={participant.lastName}
                    avatar={participant.avatar}
                    blurredAvatar={participant.blurredAvatar}
                  />
                ) : (
                  <>{initials}</>
                )}
              </div>
              <div className="mv-pl-4">
                <Link to={`/profile/${participant.username}`}>
                  <H3
                    like="h4"
                    className="mv-text-xl mv-mb-1 mv-no-underline hover:mv-underline"
                  >
                    {participant.firstName} {participant.lastName}
                  </H3>
                </Link>
                {participant.position ? (
                  <p className="mv-font-bold mv-text-sm mv-cursor-default">
                    {participant.position}
                  </p>
                ) : null}
              </div>
              <RemixFormsForm
                schema={removeParticipantSchema}
                fetcher={removeParticipantFetcher}
                action={`/event/${slug}/settings/participants/remove-participant`}
                className="mv-ml-auto"
              >
                {(remixFormsProps) => {
                  const { Button, Errors } = remixFormsProps;
                  return (
                    <>
                      <Errors />
                      <input
                        name="profileId"
                        defaultValue={participant.id}
                        hidden
                      />
                      <Button
                        className="mv-ml-auto mv-bg-transparent mv-w-10 mv-h-8 mv-flex mv-items-center mv-justify-center mv-rounded-md mv-border mv-border-transparent mv-text-neutral-600"
                        title={locales.route.content.current.remove}
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
      <footer className="mv-fixed mv-bg-white mv-border-t-2 mv-border-primary mv-w-full mv-inset-x-0 mv-bottom-0">
        <div className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl">
          <div className="mv-flex mv-flex-row mv-flex-nowrap mv-items-center mv-justify-end mv-my-4">
            <RemixFormsForm
              schema={publishSchema}
              fetcher={publishFetcher}
              action={`/event/${slug}/settings/events/publish`}
            >
              {(remixFormsProps) => {
                const { Button, Field } = remixFormsProps;
                return (
                  <>
                    <div className="mv-hidden">
                      <Field name="publish" value={!loaderData.published} />
                    </div>
                    <Button className="mv-border mv-border-primary mv-bg-white mv-text-primary mv-h-auto mv-min-h-0 mv-whitespace-nowrap mv-py-2 mv-px-6 mv-normal-case mv-leading-6 mv-inline-flex mv-cursor-pointer mv-selct-none mv-flex-wrap mv-items-center mv-justify-center mv-rounded-lg mv-text-center mv-font-semibold mv-gap-2 hover:mv-bg-primary hover:mv-text-white">
                      {loaderData.published
                        ? locales.route.content.hide
                        : locales.route.content.publish}
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
