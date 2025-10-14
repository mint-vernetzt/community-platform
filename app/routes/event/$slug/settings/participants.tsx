import { Avatar } from "@mint-vernetzt/components/src/molecules/Avatar";
import { makeDomainFunction } from "domain-functions";
import { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  Link,
  redirect,
  useActionData,
  useFetcher,
  useLoaderData,
  useParams,
  useSearchParams,
  useSubmit,
} from "react-router";
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
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { languageModuleMap } from "~/locales/.server";
import { detectLanguage } from "~/root.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { getProfileSuggestionsForAutocomplete } from "~/routes/utils.server";
import { getPublicURL } from "~/storage.server";
import { deriveEventMode } from "../../utils.server";
import { getFullDepthProfiles } from "../utils.server";
import { publishSchema } from "./events/publish";
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
import { type action as removeParticipantAction } from "./participants/remove-participant";

const createParticipantLimitSchema = (locales: EventParticipantsLocales) => {
  return z.object({
    participantLimit: z
      .string({
        invalid_type_error: locales.route.validation.participantLimit.type,
      })
      .trim()
      .regex(/^\d+$/)
      .optional()
      .transform((value) => {
        if (typeof value === "undefined" || value === "") {
          return null;
        }
        const parsedValue = parseInt(value, 10);
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
        throw locales.route.error.inputError;
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
  const [searchParams] = useSearchParams();
  const suggestionsQuery = searchParams.get("autocomplete_query");
  const submit = useSubmit();
  const actionData = useActionData<typeof action>();

  const participantLimitSchema = createParticipantLimitSchema(locales);

  const [currentParticipantLimit, setCurrentParticipantLimit] = useState<
    number | null
  >(loaderData.participantLimit || null);

  return (
    <>
      <h1 className="mb-8">{locales.route.content.headline}</h1>
      <p className="mb-8">{locales.route.content.intro}</p>
      <h4 className="mb-4 font-semibold">
        {locales.route.content.limit.headline}
      </h4>
      <p className="mb-8">{locales.route.content.limit.intro}</p>
      <RemixFormsForm method="post" schema={participantLimitSchema}>
        {({ Field, Button, register, Errors }) => {
          return (
            <>
              <Field name="participantLimit" className="mb-4">
                {() => (
                  <>
                    <InputText
                      {...register("participantLimit")}
                      id="participantLimit"
                      label={locales.route.content.limit.label}
                      value={currentParticipantLimit || ""}
                      type="text"
                      onChange={(e) => {
                        if (e.currentTarget.value === "") {
                          setCurrentParticipantLimit(null);
                          return;
                        }
                        setCurrentParticipantLimit(
                          parseInt(e.currentTarget.value)
                        );
                      }}
                    />
                  </>
                )}
              </Field>
              <Errors />
              <div className="flex flex-row">
                <Button
                  type="submit"
                  className="mb-8 h-auto min-h-0 whitespace-nowrap py-2 px-6 normal-case leading-6 inline-flex cursor-pointer outline-primary shrink-0 flex-wrap items-center justify-center rounded-lg text-center border-primary text-sm font-semibold border bg-primary text-white"
                >
                  {locales.route.content.limit.submit}
                </Button>
                <div
                  className={`text-green-500 text-bold ml-4 mt-2 ${
                    actionData?.success ? "block" : "hidden"
                  }`}
                >
                  {locales.route.content.limit.feedback}
                </div>
              </div>
            </>
          );
        }}
      </RemixFormsForm>
      <h4 className="mb-4 font-semibold">
        {locales.route.content.add.headline}
      </h4>
      <p className="mb-8">{locales.route.content.add.intro}</p>
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
          {({ Field, Button, register }) => {
            return (
              <>
                <div className="flex flex-col gap-2 w-full">
                  <div className="flex flex-row items-center mb-2">
                    <div className="flex-auto">
                      <label
                        id="label-for-name"
                        htmlFor="Name"
                        className="font-semibold"
                      >
                        {locales.route.content.add.label}
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
                            locales={locales}
                            currentLanguage={language}
                          />
                        </>
                      )}
                    </Field>
                    <div className="ml-2">
                      <Button className="bg-transparent w-10 h-8 flex items-center justify-center rounded-md border-2 border-neutral-300 text-neutral-600 mt-0.5 hover:bg-neutral-100">
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
        {locales.route.content.current.headline}
      </h4>
      <p className="mb-4">{locales.route.content.current.intro}</p>
      {loaderData.participants.length > 0 ? (
        <p className="mb-4">
          <Link
            className="mt-4 mb-4 border border-primary bg-white text-primary h-auto min-h-0 whitespace-nowrap py-2 px-6 normal-case leading-6 inline-flex cursor-pointer selct-none flex-wrap items-center justify-center rounded-lg text-center font-semibold gap-2 hover:bg-primary hover:text-white"
            to="../csv-download?type=participants&amp;depth=single"
            reloadDocument
          >
            {locales.route.content.current.download1}
          </Link>
        </p>
      ) : null}
      {loaderData.hasFullDepthParticipants ? (
        <p className="mb-4">
          <Link
            className="mt-4 mb-4 border border-primary bg-white text-primary h-auto min-h-0 whitespace-nowrap py-2 px-6 normal-case leading-6 inline-flex cursor-pointer selct-none flex-wrap items-center justify-center rounded-lg text-center font-semibold gap-2 hover:bg-primary hover:text-white"
            to="../csv-download?type=participants&amp;depth=full"
            reloadDocument
          >
            {locales.route.content.current.download2}
          </Link>
        </p>
      ) : null}
      <div className="mb-4 mt-8 @md:max-h-[630px] overflow-auto">
        {loaderData.participants.map((participant) => {
          const initials = getInitials(participant);
          return (
            <div
              key={participant.id}
              className="w-full flex items-center flex-row border-b border-neutral-400 p-4"
            >
              <div className="h-16 w-16 bg-primary text-white text-3xl flex items-center justify-center rounded-full overflow-hidden shrink-0">
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
              <div className="pl-4">
                <Link to={`/profile/${participant.username}`} prefetch="intent">
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
              <removeParticipantFetcher.Form
                method="post"
                action={`/event/${slug}/settings/participants/remove-participant`}
                className="ml-auto"
              >
                <input name="profileId" defaultValue={participant.id} hidden />
                <button
                  type="submit"
                  className="ml-auto bg-transparent w-10 h-8 flex items-center justify-center rounded-md border border-transparent text-neutral-600"
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
                </button>
                {typeof removeParticipantFetcher.data !== "undefined" &&
                removeParticipantFetcher.data !== null &&
                removeParticipantFetcher.data.success === false ? (
                  <div className={`p-4 bg-red-200 rounded-md mt-4`}>
                    {removeParticipantFetcher.data.errors._global?.join(", ")}
                    {removeParticipantFetcher.data.errors.profileId?.join(", ")}
                  </div>
                ) : null}
              </removeParticipantFetcher.Form>
            </div>
          );
        })}
      </div>
      <footer className="fixed bg-white border-t-2 border-primary w-full inset-x-0 bottom-0">
        <div className="w-full mx-auto px-4 @sm:max-w-screen-container-sm @md:max-w-screen-container-md @lg:max-w-screen-container-lg @xl:max-w-screen-container-xl @xl:px-6 @2xl:max-w-screen-container-2xl">
          <div className="flex flex-row flex-nowrap items-center justify-end my-4">
            <RemixFormsForm
              schema={publishSchema}
              method="post"
              action={`/event/${slug}/settings/events/publish`}
            >
              {(remixFormsProps) => {
                const { Button, Field } = remixFormsProps;
                return (
                  <>
                    <div className="hidden">
                      <Field name="publish" value={!loaderData.published} />
                    </div>
                    <Button className="border border-primary bg-white text-primary h-auto min-h-0 whitespace-nowrap py-2 px-6 normal-case leading-6 inline-flex cursor-pointer selct-none flex-wrap items-center justify-center rounded-lg text-center font-semibold gap-2 hover:bg-primary hover:text-white">
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
